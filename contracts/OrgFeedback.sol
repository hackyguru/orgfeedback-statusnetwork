// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract OrgFeedback {
    struct Organization {
        string name;
        string description;
        string logoIpfsCid; // IPFS CID for organization logo (optional)
        address owner;
        mapping(address => bool) members;
        mapping(address => bool) moderators; // Moderators can see all feedbacks and manage members
        address[] memberList; // Array to track all members for enumeration
        bool exists;
    }

    struct Feedback {
        address orgId;
        address sender;
        address receiver;
        string forSender;
        string forReceiver;
        string forAdmin;
        bool revealToReceiver;
        bool revealToAdmin;
        uint256 timestamp;
    }

    mapping(address => Organization) private organizations; // orgId = org owner's address
    mapping(address => address[]) private userOrgs;          // user => list of orgIds
    Feedback[] private feedbacks;

    uint256 public totalOrganizations;

    event OrganizationCreated(address indexed orgId, address owner, string name);
    event MemberAdded(address indexed orgId, address indexed member);
    event MemberRemoved(address indexed orgId, address indexed member);
    event ModeratorAdded(address indexed orgId, address indexed moderator);
    event ModeratorRemoved(address indexed orgId, address indexed moderator);
    event LogoUpdated(address indexed orgId, string logoIpfsCid);
    event FeedbackSent(address indexed orgId, address indexed sender, address indexed receiver, uint256 feedbackIndex);

    modifier onlyOrgOwner(address orgId) {
        require(organizations[orgId].exists, "Org does not exist");
        require(msg.sender == organizations[orgId].owner, "Not org owner");
        _;
    }

    modifier onlyOrgOwnerOrModerator(address orgId) {
        require(organizations[orgId].exists, "Org does not exist");
        require(
            msg.sender == organizations[orgId].owner || 
            organizations[orgId].moderators[msg.sender], 
            "Not org owner or moderator"
        );
        _;
    }

    modifier onlyOrgMember(address orgId) {
        require(organizations[orgId].exists, "Org does not exist");
        require(organizations[orgId].members[msg.sender], "Not a member");
        _;
    }

    function createOrganization(string calldata name, string calldata description) external {
        require(!organizations[msg.sender].exists, "You already own an org");

        Organization storage org = organizations[msg.sender];
        org.name = name;
        org.description = description;
        org.logoIpfsCid = ""; // Empty initially, can be updated later
        org.owner = msg.sender;
        org.exists = true;
        org.members[msg.sender] = true;
        org.moderators[msg.sender] = true; // Owner is also a moderator
        org.memberList.push(msg.sender); // Add to member list

        userOrgs[msg.sender].push(msg.sender); // owner is also a member of their own org

        totalOrganizations++;

        emit OrganizationCreated(msg.sender, msg.sender, name);
    }

    function addMember(address orgId, address member) external onlyOrgOwnerOrModerator(orgId) {
        require(!organizations[orgId].members[member], "Already a member");

        organizations[orgId].members[member] = true;
        organizations[orgId].memberList.push(member); // Add to member list
        userOrgs[member].push(orgId);

        emit MemberAdded(orgId, member);
    }

    function removeMember(address orgId, address member) external onlyOrgOwnerOrModerator(orgId) {
        require(organizations[orgId].members[member], "Not a member");
        require(member != organizations[orgId].owner, "Cannot remove owner");
        
        organizations[orgId].members[member] = false;
        // Also remove moderator status if they have it
        organizations[orgId].moderators[member] = false;

        // Remove from member list
        address[] storage memberList = organizations[orgId].memberList;
        for (uint256 i = 0; i < memberList.length; i++) {
            if (memberList[i] == member) {
                memberList[i] = memberList[memberList.length - 1];
                memberList.pop();
                break;
            }
        }

        // Remove org from user's org list (gas-inefficient for large arrays)
        address[] storage orgList = userOrgs[member];
        for (uint256 i = 0; i < orgList.length; i++) {
            if (orgList[i] == orgId) {
                orgList[i] = orgList[orgList.length - 1];
                orgList.pop();
                break;
            }
        }

        emit MemberRemoved(orgId, member);
    }

    function isMember(address orgId, address user) public view returns (bool) {
        return organizations[orgId].members[user];
    }

    function isModerator(address orgId, address user) public view returns (bool) {
        return organizations[orgId].moderators[user];
    }

    function addModerator(address orgId, address moderator) external onlyOrgOwner(orgId) {
        require(organizations[orgId].members[moderator], "Must be a member first");
        require(!organizations[orgId].moderators[moderator], "Already a moderator");

        organizations[orgId].moderators[moderator] = true;

        emit ModeratorAdded(orgId, moderator);
    }

    function removeModerator(address orgId, address moderator) external onlyOrgOwner(orgId) {
        require(organizations[orgId].moderators[moderator], "Not a moderator");
        require(moderator != organizations[orgId].owner, "Cannot remove owner");

        organizations[orgId].moderators[moderator] = false;

        emit ModeratorRemoved(orgId, moderator);
    }

    function updateLogo(address orgId, string calldata logoIpfsCid) external onlyOrgOwner(orgId) {
        organizations[orgId].logoIpfsCid = logoIpfsCid;

        emit LogoUpdated(orgId, logoIpfsCid);
    }

    function getOrgMembers(address orgId) external view onlyOrgOwnerOrModerator(orgId) returns (address[] memory) {
        return organizations[orgId].memberList;
    }

    function sendFeedback(
        address orgId,
        address receiver,
        string calldata forSender,
        string calldata forReceiver,
        string calldata forAdmin,
        bool revealToReceiver,
        bool revealToAdmin
    ) external {
        require(organizations[orgId].exists, "Org does not exist");
        require(isMember(orgId, msg.sender), "Sender not a member");
        require(isMember(orgId, receiver), "Receiver not a member");

        feedbacks.push(Feedback({
            orgId: orgId,
            sender: msg.sender,
            receiver: receiver,
            forSender: forSender,
            forReceiver: forReceiver,
            forAdmin: forAdmin,
            revealToReceiver: revealToReceiver,
            revealToAdmin: revealToAdmin,
            timestamp: block.timestamp
        }));

        emit FeedbackSent(orgId, msg.sender, receiver, feedbacks.length - 1);
    }

    function getAccessibleFeedbacks() external view returns (
        address[] memory orgIds,
        address[] memory senders,
        address[] memory receivers,
        string[] memory messages,
        uint256[] memory timestamps
    ) {
        uint256 count = 0;

        for (uint256 i = 0; i < feedbacks.length; i++) {
            Feedback storage fb = feedbacks[i];
            if (
                fb.sender == msg.sender ||
                fb.receiver == msg.sender ||
                msg.sender == organizations[fb.orgId].owner ||
                organizations[fb.orgId].moderators[msg.sender]
            ) {
                count++;
            }
        }

        orgIds = new address[](count);
        senders = new address[](count);
        receivers = new address[](count);
        messages = new string[](count);
        timestamps = new uint256[](count);

        uint256 j = 0;
        for (uint256 i = 0; i < feedbacks.length; i++) {
            Feedback storage fb = feedbacks[i];
            bool isSender = fb.sender == msg.sender;
            bool isReceiver = fb.receiver == msg.sender;
            bool isAdmin = msg.sender == organizations[fb.orgId].owner;
            bool isOrgModerator = organizations[fb.orgId].moderators[msg.sender];

            if (isSender || isReceiver || isAdmin || isOrgModerator) {
                orgIds[j] = fb.orgId;
                senders[j] = isSender
                    ? fb.sender
                    : (isReceiver && fb.revealToReceiver) || ((isAdmin || isOrgModerator) && fb.revealToAdmin)
                        ? fb.sender
                        : address(0);
                receivers[j] = fb.receiver;
                messages[j] = isSender ? fb.forSender : isReceiver ? fb.forReceiver : fb.forAdmin;
                timestamps[j] = fb.timestamp;
                j++;
            }
        }
    }

    function getOrganizationsByUser(address user) external view returns (address[] memory) {
        return userOrgs[user];
    }

    function getOrgMetadata(address orgId) external view returns (
        string memory name,
        string memory description,
        string memory logoIpfsCid,
        address owner
    ) {
        require(organizations[orgId].exists, "Org not found");
        Organization storage org = organizations[orgId];
        return (org.name, org.description, org.logoIpfsCid, org.owner);
    }

    function getFeedbackCount() external view returns (uint256) {
        return feedbacks.length;
    }
}
