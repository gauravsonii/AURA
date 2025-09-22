"""
Launchpad Contract Scanner for Aura Protocol
Performs static analysis and risk assessment of smart contracts
"""
import asyncio
import aiohttp
import json
import re
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import hashlib
from dataclasses import dataclass
import subprocess
import tempfile
import os

from config import Config

# Setup logging
logger = logging.getLogger(__name__)

@dataclass
class SecurityFlag:
    """Represents a security concern found in a contract"""
    severity: str  # "low", "medium", "high", "critical"
    category: str  # "ownership", "reentrancy", "overflow", etc.
    description: str
    line_number: Optional[int] = None
    code_snippet: Optional[str] = None

@dataclass
class ContractAnalysis:
    """Complete analysis result for a contract"""
    address: str
    risk_score: float  # 0.0 to 1.0 (1.0 = highest risk)
    flags: List[SecurityFlag]
    contract_type: str
    is_verified: bool
    has_proxy: bool
    owner_privileges: List[str]
    token_economics: Dict
    audit_status: str
    recommendation: str
    timestamp: str

class LaunchpadScanner:
    """Main class for scanning and analyzing launchpad contracts"""
    
    def __init__(self):
        self.session = None
        
        # Risk patterns for static analysis
        self.risk_patterns = {
            "unlimited_mint": {
                "pattern": r"function\s+mint\s*\([^)]*\)\s*.*\{",
                "severity": "high",
                "category": "minting",
                "description": "Contract has minting function that could allow unlimited token creation"
            },
            "owner_can_pause": {
                "pattern": r"function\s+(pause|unpause|setPaused)",
                "severity": "medium",
                "category": "ownership",
                "description": "Owner can pause contract functionality"
            },
            "arbitrary_transfer": {
                "pattern": r"function\s+transfer\s*\([^)]*address[^)]*\)",
                "severity": "high",
                "category": "transfer",
                "description": "Contract may allow arbitrary transfers"
            },
            "no_access_control": {
                "pattern": r"function\s+\w+.*public.*\{",
                "severity": "medium",
                "category": "access_control",
                "description": "Public functions without access control"
            },
            "hardcoded_addresses": {
                "pattern": r"0x[a-fA-F0-9]{40}",
                "severity": "low",
                "category": "configuration",
                "description": "Hardcoded addresses found in contract"
            },
            "delegatecall_usage": {
                "pattern": r"\.delegatecall\s*\(",
                "severity": "high",
                "category": "proxy",
                "description": "Usage of delegatecall which can be dangerous"
            },
            "selfdestruct_present": {
                "pattern": r"selfdestruct\s*\(",
                "severity": "critical",
                "category": "destruction",
                "description": "Contract can be self-destructed"
            }
        }
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def fetch_contract_source(self, address: str) -> Optional[Dict]:
        """Fetch contract source code from Snowtrace API"""
        try:
            url = f"{Config.SNOWTRACE_BASE_URL}"
            params = {
                "module": "contract",
                "action": "getsourcecode",
                "address": address,
                "apikey": Config.SNOWTRACE_API_KEY
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if data["status"] == "1" and data["result"]:
                        result = data["result"]
                        # Handle both single result dict and list of results
                        if isinstance(result, list) and len(result) > 0:
                            result = result[0]
                        
                        return {
                            "source_code": result.get("SourceCode", ""),
                            "contract_name": result.get("ContractName", ""),
                            "compiler_version": result.get("CompilerVersion", ""),
                            "optimization_used": result.get("OptimizationUsed", ""),
                            "abi": result.get("ABI", ""),
                            "is_verified": result.get("SourceCode") != "",
                            "proxy": result.get("Proxy", "0") == "1"
                        }
                else:
                    logger.error(f"Snowtrace API error: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error fetching contract source for {address}: {e}")
            return None
    
    async def fetch_contract_info(self, address: str) -> Optional[Dict]:
        """Fetch additional contract information"""
        try:
            # Get contract creation info
            url = f"{Config.SNOWTRACE_BASE_URL}"
            params = {
                "module": "contract",
                "action": "getcontractcreation",
                "contractaddresses": address,
                "apikey": Config.SNOWTRACE_API_KEY
            }
            
            creation_info = {}
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    if data["status"] == "1" and data["result"]:
                        creation_info = data["result"][0]
            
            # Get token info if it's a token contract
            token_params = {
                "module": "token",
                "action": "tokeninfo",
                "contractaddress": address,
                "apikey": Config.SNOWTRACE_API_KEY
            }
            
            token_info = {}
            async with self.session.get(url, params=token_params) as response:
                if response.status == 200:
                    data = await response.json()
                    if data["status"] == "1" and data["result"]:
                        token_info = data["result"]
            
            return {
                "creation_info": creation_info,
                "token_info": token_info
            }
            
        except Exception as e:
            logger.error(f"Error fetching contract info for {address}: {e}")
            return None
    
    def analyze_source_code(self, source_code: str) -> List[SecurityFlag]:
        """Perform static analysis on contract source code"""
        flags = []
        
        if not source_code:
            return flags
        
        # Clean up source code (handle special formats)
        if source_code.startswith("{{"):
            # Multi-file source code format
            try:
                source_data = json.loads(source_code[1:-1])
                if "sources" in source_data:
                    # Combine all source files
                    all_source = ""
                    for file_path, file_data in source_data["sources"].items():
                        all_source += file_data.get("content", "") + "\n"
                    source_code = all_source
            except json.JSONDecodeError:
                pass
        
        # Apply risk patterns
        lines = source_code.split('\n')
        for i, line in enumerate(lines):
            for pattern_name, pattern_info in self.risk_patterns.items():
                if re.search(pattern_info["pattern"], line, re.IGNORECASE):
                    flag = SecurityFlag(
                        severity=pattern_info["severity"],
                        category=pattern_info["category"],
                        description=pattern_info["description"],
                        line_number=i + 1,
                        code_snippet=line.strip()
                    )
                    flags.append(flag)
        
        # Additional analysis
        flags.extend(self._analyze_ownership_patterns(source_code))
        flags.extend(self._analyze_token_economics(source_code))
        flags.extend(self._analyze_access_control(source_code))
        
        return flags
    
    def _analyze_ownership_patterns(self, source_code: str) -> List[SecurityFlag]:
        """Analyze ownership and privileged function patterns"""
        flags = []
        
        # Check for Ownable pattern
        if "onlyOwner" in source_code:
            owner_functions = re.findall(r"function\s+(\w+).*onlyOwner", source_code)
            if len(owner_functions) > 5:
                flags.append(SecurityFlag(
                    severity="medium",
                    category="ownership",
                    description=f"Contract has {len(owner_functions)} owner-only functions: {', '.join(owner_functions[:3])}..."
                ))
        
        # Check for multisig patterns
        if "multisig" not in source_code.lower() and "timelock" not in source_code.lower():
            if "onlyOwner" in source_code:
                flags.append(SecurityFlag(
                    severity="medium",
                    category="governance",
                    description="Single owner control without multisig or timelock protection"
                ))
        
        return flags
    
    def _analyze_token_economics(self, source_code: str) -> List[SecurityFlag]:
        """Analyze token economic patterns"""
        flags = []
        
        # Check for deflationary mechanisms
        if "burn" in source_code.lower():
            flags.append(SecurityFlag(
                severity="low",
                category="tokenomics",
                description="Token has burning mechanism"
            ))
        
        # Check for fee mechanisms
        fee_patterns = ["fee", "tax", "reflections"]
        for pattern in fee_patterns:
            if pattern in source_code.lower():
                flags.append(SecurityFlag(
                    severity="medium",
                    category="tokenomics",
                    description=f"Token has {pattern} mechanism that affects transfers"
                ))
                break
        
        # Check for maximum supply
        if "maxSupply" not in source_code and "MAX_SUPPLY" not in source_code:
            flags.append(SecurityFlag(
                severity="high",
                category="tokenomics",
                description="No maximum supply limit found"
            ))
        
        return flags
    
    def _analyze_access_control(self, source_code: str) -> List[SecurityFlag]:
        """Analyze access control patterns"""
        flags = []
        
        # Check for role-based access control
        if "AccessControl" in source_code or "hasRole" in source_code:
            flags.append(SecurityFlag(
                severity="low",
                category="access_control",
                description="Uses role-based access control (good practice)"
            ))
        
        # Check for reentrancy protection
        if "nonReentrant" not in source_code and "ReentrancyGuard" not in source_code:
            if any(pattern in source_code for pattern in ["call{", ".call(", "transfer("]):
                flags.append(SecurityFlag(
                    severity="high",
                    category="reentrancy",
                    description="Potential reentrancy vulnerability without protection"
                ))
        
        return flags
    
    def calculate_risk_score(self, flags: List[SecurityFlag], contract_info: Dict) -> float:
        """Calculate overall risk score based on flags and contract info"""
        base_score = 0.0
        
        # Weight flags by severity
        severity_weights = {
            "critical": 0.4,
            "high": 0.25,
            "medium": 0.15,
            "low": 0.05
        }
        
        for flag in flags:
            base_score += severity_weights.get(flag.severity, 0.1)
        
        # Adjust based on verification status
        if not contract_info.get("is_verified", False):
            base_score += 0.3
        
        # Adjust based on proxy pattern
        if contract_info.get("proxy", False):
            base_score += 0.2
        
        # Cap at 1.0
        return min(base_score, 1.0)
    
    def generate_recommendation(self, risk_score: float, flags: List[SecurityFlag]) -> str:
        """Generate investment recommendation based on analysis"""
        critical_flags = [f for f in flags if f.severity == "critical"]
        high_flags = [f for f in flags if f.severity == "high"]
        
        if critical_flags:
            return "AVOID - Critical security issues detected"
        elif risk_score > 0.8:
            return "HIGH RISK - Proceed with extreme caution"
        elif risk_score > 0.6:
            return "MEDIUM RISK - Thorough due diligence required"
        elif risk_score > 0.4:
            return "LOW-MEDIUM RISK - Standard precautions advised"
        elif risk_score > 0.2:
            return "LOW RISK - Generally safe but monitor closely"
        else:
            return "MINIMAL RISK - Good security practices observed"
    
    def determine_contract_type(self, source_code: str, abi: str) -> str:
        """Determine the type of contract"""
        if not source_code and not abi:
            return "unknown"
        
        code_lower = source_code.lower()
        
        if "erc20" in code_lower or "transfer(" in code_lower:
            return "erc20_token"
        elif "erc721" in code_lower or "nft" in code_lower:
            return "nft"
        elif "liquidity" in code_lower or "swap" in code_lower:
            return "dex"
        elif "governance" in code_lower or "proposal" in code_lower:
            return "governance"
        elif "staking" in code_lower or "stake" in code_lower:
            return "staking"
        elif "vault" in code_lower or "deposit" in code_lower:
            return "vault"
        else:
            return "other"
    
    async def scan_contract(self, address: str) -> ContractAnalysis:
        """Perform comprehensive contract analysis"""
        logger.info(f"Scanning contract: {address}")
        
        try:
            # Fetch contract data
            source_data = await self.fetch_contract_source(address)
            contract_info = await self.fetch_contract_info(address)
            
            if not source_data:
                return ContractAnalysis(
                    address=address,
                    risk_score=0.8,  # High risk for unverified contracts
                    flags=[SecurityFlag(
                        severity="high",
                        category="verification",
                        description="Contract source code not verified"
                    )],
                    contract_type="unknown",
                    is_verified=False,
                    has_proxy=False,
                    owner_privileges=[],
                    token_economics={},
                    audit_status="unverified",
                    recommendation="HIGH RISK - Unverified contract",
                    timestamp=datetime.now().isoformat()
                )
            
            # Analyze source code
            source_code = source_data.get("source_code", "")
            flags = self.analyze_source_code(source_code)
            
            # Calculate risk score
            risk_score = self.calculate_risk_score(flags, source_data)
            
            # Determine contract type
            contract_type = self.determine_contract_type(
                source_code, 
                source_data.get("abi", "")
            )
            
            # Extract owner privileges
            owner_privileges = [
                flag.description for flag in flags 
                if flag.category == "ownership"
            ]
            
            # Extract token economics
            token_economics = self._extract_token_economics(source_code, contract_info)
            
            # Generate recommendation
            recommendation = self.generate_recommendation(risk_score, flags)
            
            return ContractAnalysis(
                address=address,
                risk_score=risk_score,
                flags=flags,
                contract_type=contract_type,
                is_verified=source_data.get("is_verified", False),
                has_proxy=source_data.get("proxy", False),
                owner_privileges=owner_privileges,
                token_economics=token_economics,
                audit_status="analyzed",
                recommendation=recommendation,
                timestamp=datetime.now().isoformat()
            )
            
        except Exception as e:
            logger.error(f"Error scanning contract {address}: {e}")
            return ContractAnalysis(
                address=address,
                risk_score=1.0,
                flags=[SecurityFlag(
                    severity="critical",
                    category="analysis",
                    description=f"Analysis failed: {str(e)}"
                )],
                contract_type="unknown",
                is_verified=False,
                has_proxy=False,
                owner_privileges=[],
                token_economics={},
                audit_status="failed",
                recommendation="ANALYSIS FAILED - Cannot determine safety",
                timestamp=datetime.now().isoformat()
            )
    
    def _extract_token_economics(self, source_code: str, contract_info: Dict) -> Dict:
        """Extract token economics information"""
        economics = {}
        
        # Extract from token info if available
        token_info = contract_info.get("token_info", {}) if contract_info else {}
        
        economics.update({
            "name": token_info.get("tokenName", ""),
            "symbol": token_info.get("symbol", ""),
            "decimals": token_info.get("decimals", ""),
            "total_supply": token_info.get("totalSupply", "")
        })
        
        # Analyze source code for additional economics
        if "mint" in source_code.lower():
            economics["has_minting"] = True
        if "burn" in source_code.lower():
            economics["has_burning"] = True
        if "fee" in source_code.lower() or "tax" in source_code.lower():
            economics["has_fees"] = True
        
        return economics

# Utility functions
async def scan_contract_address(address: str) -> Dict:
    """Scan a contract address and return analysis"""
    async with LaunchpadScanner() as scanner:
        analysis = await scanner.scan_contract(address)
        
        return {
            "address": analysis.address,
            "risk_score": analysis.risk_score,
            "risk_level": "high" if analysis.risk_score > 0.7 else "medium" if analysis.risk_score > 0.4 else "low",
            "flags": [
                {
                    "severity": flag.severity,
                    "category": flag.category,
                    "description": flag.description,
                    "line_number": flag.line_number
                } for flag in analysis.flags
            ],
            "contract_type": analysis.contract_type,
            "is_verified": analysis.is_verified,
            "has_proxy": analysis.has_proxy,
            "owner_privileges": analysis.owner_privileges,
            "token_economics": analysis.token_economics,
            "recommendation": analysis.recommendation,
            "timestamp": analysis.timestamp
        }

async def quick_risk_assessment(address: str) -> Dict:
    """Quick risk assessment for immediate feedback"""
    try:
        # Basic validation
        if not address or len(address) != 42 or not address.startswith("0x"):
            return {
                "risk_score": 1.0,
                "risk_level": "high",
                "message": "Invalid contract address format",
                "timestamp": datetime.now().isoformat()
            }
        
        # Perform quick scan
        result = await scan_contract_address(address)
        
        return {
            "risk_score": result["risk_score"],
            "risk_level": result["risk_level"],
            "message": result["recommendation"],
            "quick_flags": len([f for f in result["flags"] if f["severity"] in ["critical", "high"]]),
            "is_verified": result["is_verified"],
            "timestamp": result["timestamp"]
        }
        
    except Exception as e:
        logger.error(f"Quick risk assessment failed for {address}: {e}")
        return {
            "risk_score": 1.0,
            "risk_level": "high",
            "message": "Assessment failed - proceed with caution",
            "timestamp": datetime.now().isoformat()
        }

# Test function
async def test_scanner():
    """Test the contract scanner"""
    print("Testing Aura Launchpad Scanner...")
    
    # Test with a known contract (WAVAX on Avalanche)
    test_address = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"
    
    print(f"\n1. Testing quick risk assessment for {test_address}...")
    quick_result = await quick_risk_assessment(test_address)
    print(f"Quick assessment: {quick_result}")
    
    print(f"\n2. Testing full contract scan for {test_address}...")
    full_result = await scan_contract_address(test_address)
    print(f"Full scan result: {json.dumps(full_result, indent=2)}")

if __name__ == "__main__":
    asyncio.run(test_scanner())