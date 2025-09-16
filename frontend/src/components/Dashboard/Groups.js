import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  VStack,
  HStack,
  Avatar,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  useToast,
  Card,
  CardBody,
  Badge,
  Icon,
  Divider,
  Textarea,
  Switch,
  FormControl,
  FormLabel,
  Code,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import { AddIcon, ExternalLinkIcon, ArrowForwardIcon } from "@chakra-ui/icons";
import { FaUsers, FaHashtag, FaVolumeUp, FaBullhorn } from "react-icons/fa";
import chatContext from "../../context/chatContext";
import SingleMessage from "./SingleMessage";

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [invitePreview, setInvitePreview] = useState(null);

  // Copy to clipboard function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };
  const [newGroupData, setNewGroupData] = useState({
    name: "",
    description: "",
    isPublic: false
  });
  const [newChannelData, setNewChannelData] = useState({
    name: "",
    type: "text",
    description: ""
  });

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isJoinOpen, onOpen: onJoinOpen, onClose: onJoinClose } = useDisclosure();
  const { isOpen: isChannelOpen, onOpen: onChannelOpen, onClose: onChannelClose } = useDisclosure();
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();

  const context = useContext(chatContext);
  const { hostName, user, socket } = context;
  const toast = useToast();

  // Fetch group messages for selected channel
  const fetchGroupMessages = useCallback(async (groupId, channelId) => {
    try {
      const response = await fetch(`${hostName}/groups/${groupId}/channels/${channelId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token')
        }
      });
      
      if (response.ok) {
        const messages = await response.json();
        setGroupMessages(messages);
      }
    } catch (error) {
      console.error('Error fetching group messages:', error);
    }
  }, [hostName]);

  // Send group message
  const sendGroupMessage = async () => {
    if (!newMessage.trim() || !selectedGroup || !selectedChannel) return;

    try {
      const messageData = {
        groupId: selectedGroup._id,
        channelId: selectedChannel._id,
        content: newMessage,
        sender: user._id
      };

      // Send via socket for real-time delivery
      socket.emit('send-group-message', messageData);
      
      // Also send to backend API
      const response = await fetch(`${hostName}/groups/${selectedGroup._id}/channels/${selectedChannel._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ content: newMessage })
      });

      if (response.ok) {
        setNewMessage("");
      }
    } catch (error) {
      console.error('Error sending group message:', error);
      toast({
        title: "Error sending message",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchGroups();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Socket event listeners for group messages
  useEffect(() => {
    if (socket) {
      // Listen for new group messages
      socket.on('group-message-received', (messageData) => {
        if (selectedChannel && messageData.channelId === selectedChannel._id) {
          setGroupMessages(prev => [...prev, messageData]);
        }
      });

      // Join group room when group is selected
      if (selectedGroup) {
        socket.emit('join-group', selectedGroup._id);
      }

      return () => {
        socket.off('group-message-received');
      };
    }
  }, [socket, selectedGroup, selectedChannel]);

  // Fetch messages when channel changes
  useEffect(() => {
    if (selectedGroup && selectedChannel) {
      fetchGroupMessages(selectedGroup._id, selectedChannel._id);
    }
  }, [selectedGroup, selectedChannel, fetchGroupMessages]);

  // Auto-select first channel when group is selected
  useEffect(() => {
    if (selectedGroup && selectedGroup.channels && selectedGroup.channels.length > 0 && !selectedChannel) {
      setSelectedChannel(selectedGroup.channels[0]);
    }
  }, [selectedGroup, selectedChannel]);

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${hostName}/groups/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const createGroup = async () => {
    if (!newGroupData.name.trim()) {
      toast({
        title: "Group name is required",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(`${hostName}/groups/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify(newGroupData),
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(prev => [data.group, ...prev]);
        setNewGroupData({ name: "", description: "", isPublic: false });
        onCreateClose();
        toast({
          title: "Group created successfully!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        const error = await response.json();
        toast({
          title: error.error || "Failed to create group",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to create group",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const joinGroup = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Invite code is required",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(`${hostName}/groups/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({ inviteCode }),
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(prev => [data.group, ...prev]);
        setInviteCode("");
        setInvitePreview(null);
        onJoinClose();
        toast({
          title: "Successfully joined the group!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        const error = await response.json();
        toast({
          title: error.error || "Failed to join group",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to join group",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const previewInvite = async (code) => {
    if (!code.trim()) {
      setInvitePreview(null);
      return;
    }

    try {
      const response = await fetch(`${hostName}/groups/invite/${code}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvitePreview(data);
      } else {
        setInvitePreview(null);
      }
    } catch (error) {
      setInvitePreview(null);
    }
  };

  // Disable invite code
  const disableInviteCode = async (groupId) => {
    try {
      const response = await fetch(`${hostName}/groups/${groupId}/invite`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('token')
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Invite code disabled successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        // Update the group in state
        setGroups(prev => prev.map(group => 
          group._id === groupId 
            ? { ...group, inviteCode: null }
            : group
        ));
        
        // Update selected group if it's the current one
        if (selectedGroup?._id === groupId) {
          setSelectedGroup(prev => ({ ...prev, inviteCode: null }));
        }
      } else {
        throw new Error(data.error || 'Failed to disable invite code');
      }
    } catch (error) {
      console.error('Error disabling invite code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to disable invite code",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const generateInviteCode = async (groupId) => {
    setGeneratingInvite(true);
    try {
      const response = await fetch(`${hostName}/groups/${groupId}/invite/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update the group in state with new invite code
        setGroups(prev => prev.map(group => 
          group._id === groupId 
            ? { ...group, inviteCode: data.inviteCode }
            : group
        ));

        if (selectedGroup && selectedGroup._id === groupId) {
          setSelectedGroup(prev => ({ ...prev, inviteCode: data.inviteCode }));
        }

        toast({
          title: "New invite code generated!",
          description: `Invite code: ${data.inviteCode}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        const error = await response.json();
        toast({
          title: error.error || "Failed to generate invite code",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to generate invite code",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setGeneratingInvite(false);
    }
  };

  const createChannel = async () => {
    if (!newChannelData.name.trim() || !selectedGroup) {
      toast({
        title: "Channel name is required",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(`${hostName}/groups/${selectedGroup._id}/channels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify(newChannelData),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the selected group with new channel
        setGroups(prev => prev.map(group => 
          group._id === selectedGroup._id 
            ? { ...group, channels: [...group.channels, data.channel] }
            : group
        ));
        setNewChannelData({ name: "", type: "text", description: "" });
        onChannelClose();
        toast({
          title: "Channel created successfully!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        const error = await response.json();
        toast({
          title: error.error || "Failed to create channel",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to create channel",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getChannelIcon = (type) => {
    switch (type) {
      case "voice": return FaVolumeUp;
      case "announcement": return FaBullhorn;
      default: return FaHashtag;
    }
  };

  const selectGroup = async (group) => {
    setSelectedGroup(group);
    setSelectedChannel(null); // Reset selected channel
    setGroupMessages([]); // Clear previous messages
    
    // Fetch detailed group info if needed
    try {
      const response = await fetch(`${hostName}/groups/${group._id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
      });

      if (response.ok) {
        const detailedGroup = await response.json();
        setSelectedGroup(detailedGroup);
      }
    } catch (error) {
      console.error("Error fetching group details:", error);
    }
  };

  return (
    <Flex h="100vh" bg="gray.50">
      {/* Groups Sidebar */}
      <Box w="240px" bg="gray.800" color="white" p={4}>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="bold">Groups</Text>
            <HStack>
              <Button size="sm" colorScheme="green" onClick={onCreateOpen}>
                <AddIcon boxSize={3} />
              </Button>
              <Button size="sm" colorScheme="blue" onClick={onJoinOpen}>
                <ExternalLinkIcon boxSize={3} />
              </Button>
            </HStack>
          </HStack>

          <Divider />

          <VStack spacing={2} align="stretch">
            {groups.map((group) => (
              <Card
                key={group._id}
                bg={selectedGroup?._id === group._id ? "gray.700" : "gray.750"}
                _hover={{ bg: "gray.700" }}
                cursor="pointer"
                onClick={() => selectGroup(group)}
              >
                <CardBody p={3}>
                  <HStack>
                    <Avatar size="sm" src={group.avatar} name={group.name} />
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="sm" fontWeight="semibold" color="white">
                        {group.name}
                      </Text>
                      <HStack>
                        <Icon as={FaUsers} boxSize={3} color="gray.400" />
                        <Text fontSize="xs" color="gray.400">
                          {group.members?.length || 0} members
                        </Text>
                      </HStack>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        </VStack>
      </Box>

      {/* Group Content */}
      <Flex flex={1} bg="white">
        {selectedGroup ? (
          <Flex w="100%" h="100%">
            {/* Channels Sidebar */}
            <Box w="240px" bg="gray.100" borderRight="1px" borderColor="gray.200">
              <VStack spacing={0} align="stretch" h="100%">
                {/* Group Header */}
                <Box p={3} bg="white" borderBottom="1px" borderColor="gray.200">
                  <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                      <Text fontSize="md" fontWeight="bold">{selectedGroup.name}</Text>
                      <Text fontSize="xs" color="gray.600">{selectedGroup.members?.length || 0} members</Text>
                    </VStack>
                    {selectedGroup.owner === user?._id && (
                      <Button 
                        size="xs" 
                        onClick={onSettingsOpen}
                        colorScheme="gray"
                        variant="ghost"
                      >
                        ⚙️
                      </Button>
                    )}
                  </HStack>
                </Box>

                {/* Channels List */}
                <Box flex={1} p={3}>
                  <Text fontSize="xs" fontWeight="semibold" mb={2} color="gray.600" textTransform="uppercase">
                    Text Channels
                  </Text>
                  <VStack spacing={1} align="stretch">
                    {selectedGroup.channels?.map((channel) => (
                      <Box
                        key={channel._id}
                        p={2}
                        borderRadius="md"
                        bg={selectedChannel?._id === channel._id ? "purple.100" : "transparent"}
                        _hover={{ bg: "gray.200" }}
                        cursor="pointer"
                        onClick={() => {
                          setSelectedChannel(channel);
                          fetchGroupMessages(selectedGroup._id, channel._id);
                        }}
                      >
                        <HStack>
                          <Icon as={getChannelIcon(channel.type)} color="gray.500" size="sm" />
                          <Text fontSize="sm" fontWeight={selectedChannel?._id === channel._id ? "semibold" : "normal"}>
                            {channel.name}
                          </Text>
                        </HStack>
                      </Box>
                    ))}
                    {selectedGroup.owner === user?._id && (
                      <Button 
                        size="sm" 
                        leftIcon={<AddIcon />} 
                        onClick={onChannelOpen}
                        colorScheme="purple"
                        variant="ghost"
                        justifyContent="flex-start"
                        fontSize="sm"
                      >
                        Add Channel
                      </Button>
                    )}
                  </VStack>
                </Box>
              </VStack>
            </Box>

            {/* Chat Area */}
            <Flex flex={1} direction="column" h="100%">
              {selectedChannel ? (
                <>
                  {/* Channel Header */}
                  <Box p={3} bg="white" borderBottom="1px" borderColor="gray.200">
                    <HStack>
                      <Icon as={getChannelIcon(selectedChannel.type)} color="gray.500" />
                      <Text fontSize="lg" fontWeight="bold">#{selectedChannel.name}</Text>
                      {selectedChannel.description && (
                        <>
                          <Text color="gray.400">|</Text>
                          <Text fontSize="sm" color="gray.600">{selectedChannel.description}</Text>
                        </>
                      )}
                    </HStack>
                  </Box>

                  {/* Messages Area */}
                  <Box flex={1} p={4} overflowY="auto" css={{
                    "&::-webkit-scrollbar": {
                      width: "5px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "gray.300",
                      borderRadius: "5px",
                    },
                    "&::-webkit-scrollbar-track": {
                      display: "none",
                    },
                  }}>
                    <VStack spacing={3} align="stretch">
                      {groupMessages.length === 0 ? (
                        <Text color="gray.500" textAlign="center" mt={8}>
                          No messages yet. Start the conversation!
                        </Text>
                      ) : (
                        groupMessages.map((message) => (
                          <SingleMessage
                            key={message._id}
                            message={message}
                            isOwnMessage={message.sender._id === user._id}
                          />
                        ))
                      )}
                    </VStack>
                  </Box>

                  {/* Message Input */}
                  <Box p={4} bg="white" borderTop="1px" borderColor="gray.200">
                    <InputGroup>
                      <Input
                        placeholder={`Message #${selectedChannel.name}`}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendGroupMessage();
                          }
                        }}
                        pr="4rem"
                      />
                      <InputRightElement width="4rem">
                        <Button 
                          h="1.75rem" 
                          size="sm" 
                          onClick={sendGroupMessage}
                          colorScheme="purple"
                          isDisabled={!newMessage.trim()}
                        >
                          <ArrowForwardIcon />
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                  </Box>
                </>
              ) : (
                <Flex h="100%" align="center" justify="center">
                  <VStack spacing={4}>
                    <Icon as={FaHashtag} boxSize={12} color="gray.400" />
                    <Text fontSize="lg" color="gray.600">Select a channel to start chatting</Text>
                  </VStack>
                </Flex>
              )}
            </Flex>
          </Flex>
        ) : (
          <Flex h="100%" align="center" justify="center">
            <VStack spacing={4}>
              <Icon as={FaUsers} boxSize={16} color="gray.400" />
              <Text fontSize="xl" color="gray.600">Select a group to start chatting</Text>
              <HStack>
                <Button colorScheme="purple" onClick={onCreateOpen}>Create Group</Button>
                <Button variant="outline" onClick={onJoinOpen}>Join Group</Button>
              </HStack>
            </VStack>
          </Flex>
        )}
      </Flex>

      {/* Create Group Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Group</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Group Name</FormLabel>
                <Input
                  placeholder="Enter group name"
                  value={newGroupData.name}
                  onChange={(e) => setNewGroupData(prev => ({ ...prev, name: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Enter group description"
                  value={newGroupData.description}
                  onChange={(e) => setNewGroupData(prev => ({ ...prev, description: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <HStack justify="space-between">
                  <FormLabel mb={0}>Public Group</FormLabel>
                  <Switch
                    isChecked={newGroupData.isPublic}
                    onChange={(e) => setNewGroupData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  />
                </HStack>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>Cancel</Button>
            <Button colorScheme="purple" onClick={createGroup}>Create Group</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Join Group Modal */}
      <Modal isOpen={isJoinOpen} onClose={onJoinClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Join Group</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Invite Code</FormLabel>
                <Input
                  placeholder="Enter invite code (e.g., AbC123Xy)"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value);
                    previewInvite(e.target.value);
                  }}
                  fontFamily="mono"
                  textTransform="uppercase"
                />
              </FormControl>
              
              {invitePreview && (
                <Card w="100%" bg="blue.50" borderColor="blue.200">
                  <CardBody>
                    <VStack spacing={3}>
                      <HStack w="100%">
                        <Avatar 
                          src={invitePreview.avatar} 
                          name={invitePreview.groupName}
                          size="lg"
                        />
                        <VStack align="start" spacing={1} flex={1}>
                          <Text fontSize="lg" fontWeight="bold">
                            {invitePreview.groupName}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {invitePreview.description}
                          </Text>
                          <HStack>
                            <Badge colorScheme="blue">
                              {invitePreview.memberCount} members
                            </Badge>
                            {invitePreview.isPublic && (
                              <Badge colorScheme="green">Public</Badge>
                            )}
                          </HStack>
                        </VStack>
                      </HStack>
                      <Text fontSize="sm" color="gray.700">
                        You're invited to join this group by {invitePreview.owner?.name}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onJoinClose}>Cancel</Button>
            <Button 
              colorScheme="blue" 
              onClick={joinGroup}
              isDisabled={!inviteCode.trim() || !invitePreview}
            >
              Join Group
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Channel Modal */}
      <Modal isOpen={isChannelOpen} onClose={onChannelClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Channel</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Channel Name</FormLabel>
                <Input
                  placeholder="Enter channel name"
                  value={newChannelData.name}
                  onChange={(e) => setNewChannelData(prev => ({ ...prev, name: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Channel Type</FormLabel>
                <select
                  value={newChannelData.type}
                  onChange={(e) => setNewChannelData(prev => ({ ...prev, type: e.target.value }))}
                  style={{ width: "100%", padding: "8px", border: "1px solid #e2e8f0", borderRadius: "6px" }}
                >
                  <option value="text">Text Channel</option>
                  <option value="voice">Voice Channel</option>
                  <option value="announcement">Announcement Channel</option>
                </select>
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Enter channel description"
                  value={newChannelData.description}
                  onChange={(e) => setNewChannelData(prev => ({ ...prev, description: e.target.value }))}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onChannelClose}>Cancel</Button>
            <Button colorScheme="purple" onClick={createChannel}>Create Channel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Group Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Group Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              {/* Group Info */}
              <VStack spacing={3} align="stretch">
                <Text fontSize="lg" fontWeight="semibold">Group Information</Text>
                <HStack>
                  <Avatar src={selectedGroup?.avatar} name={selectedGroup?.name} size="lg" />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xl" fontWeight="bold">{selectedGroup?.name}</Text>
                    <Text color="gray.600">{selectedGroup?.description}</Text>
                    <Badge colorScheme="purple">{selectedGroup?.members?.length || 0} members</Badge>
                  </VStack>
                </HStack>
              </VStack>

              {/* Invite Section */}
              <VStack spacing={3} align="stretch">
                <Text fontSize="lg" fontWeight="semibold">Group Invites</Text>
                
                {selectedGroup?.inviteCode && (
                  <Card bg="green.50" borderColor="green.200">
                    <CardBody>
                      <VStack spacing={3}>
                        <HStack w="100%" justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm" color="gray.600">Active Invite Code</Text>
                            <HStack>
                              <Code fontSize="lg" colorScheme="green" p={2}>
                                {selectedGroup.inviteCode}
                              </Code>
                              <Button
                                size="sm"
                                colorScheme="green"
                                variant="outline"
                                onClick={() => copyToClipboard(selectedGroup.inviteCode)}
                              >
                                Copy
                              </Button>
                            </HStack>
                          </VStack>
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => disableInviteCode(selectedGroup._id)}
                          >
                            Disable
                          </Button>
                        </HStack>
                        <Text fontSize="xs" color="gray.500">
                          Share this code to invite others to your group
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                )}
                
                <Button
                  colorScheme="blue"
                  variant={selectedGroup?.inviteCode ? "outline" : "solid"}
                  onClick={() => generateInviteCode(selectedGroup._id)}
                  isLoading={generatingInvite}
                  loadingText="Generating..."
                >
                  {selectedGroup?.inviteCode 
                    ? "Generate New Code" 
                    : "Generate Invite Code"
                  }
                </Button>
              </VStack>

              {/* Members Section */}
              <VStack spacing={3} align="stretch">
                <Text fontSize="lg" fontWeight="semibold">Members</Text>
                <VStack spacing={2} align="stretch" maxH="200px" overflowY="auto">
                  {selectedGroup?.members?.map((member) => (
                    <HStack key={member._id} p={2} bg="gray.50" borderRadius="md">
                      <Avatar src={member.avatar} name={member.name} size="sm" />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontWeight="medium">{member.name}</Text>
                        <Text fontSize="sm" color="gray.600">{member.email}</Text>
                      </VStack>
                      {member._id === selectedGroup.owner && (
                        <Badge colorScheme="purple">Owner</Badge>
                      )}
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onSettingsClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default Groups;