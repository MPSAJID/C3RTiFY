const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

// Connect to the local Ethereum node
const web3 = new Web3('http://127.0.0.1:8545');

// Verify connection
web3.eth.getAccounts()
    .then(accounts => {
        console.log('Connected to Ganache with accounts:', accounts);
    })
    .catch(error => {
        console.error('Error connecting to Ganache:', error);
    });

// Function to get contract ABI and address from Truffle artifacts
function getContractData() {
    const artifactPath = path.resolve(__dirname, './build/contracts/Certification.json');
    console.log(`Looking for contract artifact at: ${artifactPath}`);
    
    try {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        const networkId = '5777'; // Default network id for Ganache GUI
        const contractAddress = artifact.networks[networkId]?.address;

        if (!contractAddress) {
            throw new Error(`Contract address not found in artifact for networkId ${networkId}`);
        }

        return {
            abi: artifact.abi,
            address: contractAddress
        };
    } catch (err) {
        console.error(`Error: ${artifactPath} not found or invalid.`);
        throw err;
    }
}

// Load contract ABI and address
const { abi: contractABI, address: contractAddress } = getContractData();
// Create contract instance
if (contractAddress && contractABI.length > 0) {
    const contract = new web3.eth.Contract(contractABI, contractAddress);

     // Function to upload file to Pinata
     async function uploadToPinata(filePath) {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        try {
            const response = await axios.post(`https://api.pinata.cloud/pinning/pinFileToIPFS`, form, {
                headers: {
                    'Authorization': `Bearer ${process.env.pinataJWT}`,
                    ...form.getHeaders()
                }
            });
            return response.data.IpfsHash;
        } catch (error) {
            console.error('Error uploading to Pinata:', error);
            throw error;
        }
    }
    
    // Function to store hash on blockchain
    async function storeHashOnBlockchain(certId,  ipfsHash) {
        if (!contract) {
            throw new Error('Contract is not properly initialized.');
        }
        const accounts = await web3.eth.getAccounts();
        try {
            const gasEstimate = await contract.methods.generateCertificate(certId,"","","","","", ipfsHash).estimateGas({ from: accounts[0] });
      
            await contract.methods.generateCertificate(certId,"","","","","", ipfsHash).send({ from: accounts[0], gas: gasEstimate });
            console.log('IPFS hash stored on blockchain successfully!');
        } catch (error) {
            console.error('Error storing hash on blockchain:', error);
            throw error;
        }
    }

    async function revokeCertificate(certId) {
        const accounts = await web3.eth.getAccounts();
        await contract.methods.revokeCertificate(certId).send({ from: accounts[0] });
    }

    async function verifyCertificateOnBlockchain(certId) {
        if (!contract) {
            throw new Error('Contract is not properly initialized.');
        }
    
        try {
            const certData = await contract.methods.isVerified(certId).call();
            return certData;  // Check if the certificate exists
        } catch (error) {
            console.error('Error verifying certificate on blockchain:', error);
            throw error;
        }
    }

    async function getCertificate(certid) {
        try {
            const certificate = await contract.methods.getCertificate(certid).call();
            return certificate;
        } catch (error) {
            console.error('Error fetching certificate from blockchain:', error);
            throw error;
        }
    }

    module.exports = { uploadToPinata, storeHashOnBlockchain, verifyCertificateOnBlockchain, getCertificate, revokeCertificate };
} else {
    console.error('Contract ABI or address is missing.');
}
