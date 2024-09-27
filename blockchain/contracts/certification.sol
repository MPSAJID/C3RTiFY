// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract Certification {
    struct Certificate{
        string name;
        string usn;
        string sem;
        string branch;
        string course;
        string ipfshash;
        bool isRevoked;
    }
    mapping (string => Certificate) public certificates;
    event certificateGenerated(string certid);
    event CertificateRevoked(string certid);

    function generateCertificate(
        string memory _certid,
        string memory _name,
        string memory _usn,
        string memory _sem,
        string memory _branch,
        string memory _course,
        string memory _ipfshash
    ) public {
      require(bytes(certificates[_certid].ipfshash).length == 0, 
      "certificate with this id already exists ");
      Certificate memory cert = Certificate({
        usn : _usn,
        name : _name,
        sem : _sem,
        branch : _branch,
        course : _course,
        ipfshash : _ipfshash,
        isRevoked: false

      });

      certificates[_certid] = cert;

      emit certificateGenerated(_certid);
    }

    function revokeCertificate(string memory _certid) public {

        require(bytes(certificates[_certid].ipfshash).length != 0, "Certificate does not exist");
        require(!certificates[_certid].isRevoked, "Certificate has already been revoked");
        certificates[_certid].isRevoked = true;
        emit CertificateRevoked(_certid);
        
    }


    function getCertificate(string memory _certid) public view 
        returns (
            string memory _usn,
            string memory _name,
            string memory _sem,
            string memory _course,
            string memory _branch,
            string memory _ipfshash,
            bool _isRevoked
        ) {
        Certificate memory cert = certificates[_certid];
        require(
            bytes(certificates[_certid].ipfshash).length != 0,
            "Certificate with this ID does not exist"
        );
        require(!cert.isRevoked, "Certificate has been revoked");
        return (cert.usn, cert.name, cert.sem, cert.branch, cert.course, cert.ipfshash, cert.isRevoked);
    }


    function isVerified(
        string memory _certid
    ) public view returns (bool) {
        return bytes(certificates[_certid].ipfshash).length != 0 && !certificates[_certid].isRevoked;
    }

}
