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
    }
    mapping (string => Certificate) public certificates;
    event certificateGenerated(string certid);

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
        ipfshash : _ipfshash

      });

      certificates[_certid] = cert;

      emit certificateGenerated(_certid);
    }


    function getCertificate(string memory _certid) public view 
        returns (
            string memory _usn,
            string memory _name,
            string memory _sem,
            string memory _course,
            string memory _branch,
            string memory _ipfshash
        ) {
        Certificate memory cert = certificates[_certid];
        require(
            bytes(certificates[_certid].ipfshash).length != 0,
            "Certificate with this ID does not exist"
        );
        return (cert.usn, cert.name, cert.sem, cert.branch, cert.course, cert.ipfshash);
    }


    function isVerified(
        string memory _certid
    ) public view returns (bool) {
        return bytes(certificates[_certid].ipfshash).length != 0;
    }

}
