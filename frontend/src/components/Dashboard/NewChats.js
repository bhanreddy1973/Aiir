import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import {
  Box,
  Flex,
  Input,
  Text,
  Button,
  VStack,
  HStack,
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  useToast,
  IconButton,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  ChevronRightIcon,
  CopyIcon,
  CheckIcon,
  CloseIcon,
} from "@chakra-ui/icons";
import { useContext } from "react";
import chatContext from "../../context/chatContext";

const NewChats = (props) => {
  const [searchCode, setSearchCode] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const context = useContext(chatContext);
  const { hostName, user, setMyChatList, setReceiver, setActiveChatId, setUser } = context;
  const toast = useToast();

  // Fetch friend requests and friends on component mount
  useEffect(() => {
    fetchFriendRequests();
    fetchFriends();
    refreshUserData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFriendRequests = async () => {
    try {
      const response = await fetch(`${hostName}/friends/requests`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setFriendRequests(data);
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch(`${hostName}/friends/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const searchByCode = async () => {
    if (!searchCode.trim()) {
      toast({
        title: "Enter a friend code",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${hostName}/friends/search/${searchCode}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFoundUser(data);
        toast({
          title: "User found!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        const error = await response.json();
        toast({
          title: error.error || "User not found",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setFoundUser(null);
      }
    } catch (error) {
      toast({
        title: "Search failed",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    setIsLoading(false);
  };

  const sendFriendRequest = async (friendCode) => {
    try {
      const response = await fetch(`${hostName}/friends/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({ friendCode }),
      });

      if (response.ok) {
        toast({
          title: "Friend request sent!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setFoundUser(null);
        setSearchCode("");
      } else {
        const error = await response.json();
        toast({
          title: error.error || "Failed to send request",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to send request",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      const response = await fetch(`${hostName}/friends/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({ requestId }),
      });

      if (response.ok) {
        toast({
          title: "Friend request accepted!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        fetchFriendRequests();
        fetchFriends();
      } else {
        const error = await response.json();
        toast({
          title: error.error || "Failed to accept request",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to accept request",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const declineFriendRequest = async (requestId) => {
    try {
      const response = await fetch(`${hostName}/friends/decline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({ requestId }),
      });

      if (response.ok) {
        toast({
          title: "Friend request declined",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        fetchFriendRequests();
      } else {
        const error = await response.json();
        toast({
          title: error.error || "Failed to decline request",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to decline request",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const copyFriendCode = () => {
    if (!user?.friendCode || user?.friendCode === "Generating...") {
      toast({
        title: "Friend code not ready",
        description: "Please wait for your friend code to load",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    navigator.clipboard.writeText(user.friendCode);
    setCopied(true);
    toast({
      title: "Friend code copied!",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const refreshUserData = async () => {
    try {
      const response = await fetch(`${hostName}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        // Update user in context
        setUser(userData);
        toast({
          title: "Profile updated!",
          description: "Your friend code is now ready",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
      toast({
        title: "Failed to refresh",
        description: "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const startChat = async (friendId) => {
    const payload = { members: [user._id, friendId] };
    try {
      const response = await fetch(`${hostName}/conversation/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const conversation = await response.json();
        setMyChatList((prev) => [...prev, conversation]);
        setReceiver(friends.find(f => f._id === friendId));
        setActiveChatId(conversation._id);
        toast({
          title: "Chat started!",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to start chat",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box h="100%" bg="gray.50">
      <Flex justify="space-between" align="center" p={4} bg="white" borderBottom="1px" borderColor="gray.200">
        <Button 
          onClick={() => props.setactiveTab(0)}
          variant="ghost"
          leftIcon={<ArrowBackIcon />}
          size="sm"
        >
          Back
        </Button>
        <Text fontSize="lg" fontWeight="bold" color="purple.600">
          Add Friends
        </Text>
        <Box w="60px" />
      </Flex>

      <Box p={4}>
        <Tabs colorScheme="purple" variant="soft-rounded">
          <TabList>
            <Tab>Add Friend</Tab>
            <Tab>Friend Requests {friendRequests.length > 0 && <Badge ml={2} colorScheme="red">{friendRequests.length}</Badge>}</Tab>
            <Tab>My Friends</Tab>
          </TabList>

          <TabPanels>
            {/* Add Friend Panel */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                {/* Friend Code Display */}
                <Card>
                  <CardHeader>
                    <HStack justify="space-between">
                      <Text fontSize="md" fontWeight="semibold">Your Friend Code</Text>
                      {(!user?.friendCode || user?.friendCode === "Generating...") && (
                        <Button 
                          size="xs" 
                          onClick={refreshUserData}
                          colorScheme="purple"
                          variant="ghost"
                        >
                          Refresh
                        </Button>
                      )}
                    </HStack>
                  </CardHeader>
                  <CardBody pt={0}>
                    <HStack>
                      <Input 
                        value={user?.friendCode || "Generating..."}
                        isReadOnly
                        bg={user?.friendCode ? "gray.100" : "yellow.50"}
                        fontFamily="mono"
                        fontSize="lg"
                        textAlign="center"
                        placeholder="Generating your friend code..."
                      />
                      <IconButton
                        icon={copied ? <CheckIcon /> : <CopyIcon />}
                        onClick={copyFriendCode}
                        colorScheme={copied ? "green" : "purple"}
                        aria-label="Copy friend code"
                        isDisabled={!user?.friendCode || user?.friendCode === "Generating..."}
                      />
                    </HStack>
                    <Text fontSize="sm" color="gray.600" mt={2}>
                      {user?.friendCode ? 
                        "Share this code with friends so they can add you!" :
                        "Your friend code is being generated. Please wait..."
                      }
                    </Text>
                  </CardBody>
                </Card>

                {/* Search by Friend Code */}
                <Card>
                  <CardHeader>
                    <Text fontSize="md" fontWeight="semibold">Add Friend by Code</Text>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack spacing={3} align="stretch">
                      <HStack>
                        <Input
                          placeholder="Enter friend code (e.g., ABC123XY)"
                          value={searchCode}
                          onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                          maxLength={8}
                          fontFamily="mono"
                        />
                        <Button
                          onClick={searchByCode}
                          colorScheme="purple"
                          isLoading={isLoading}
                        >
                          Search
                        </Button>
                      </HStack>

                      {foundUser && (
                        <Card bg="purple.50" borderColor="purple.200">
                          <CardBody>
                            <HStack justify="space-between">
                              <HStack>
                                <Avatar 
                                  src={foundUser.profilePic} 
                                  name={foundUser.name}
                                  size="md"
                                />
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="bold">{foundUser.name}</Text>
                                  <Text fontSize="sm" color="gray.600">
                                    Code: {foundUser.friendCode}
                                  </Text>
                                </VStack>
                              </HStack>
                              <Button
                                colorScheme="purple"
                                size="sm"
                                onClick={() => sendFriendRequest(foundUser.friendCode)}
                              >
                                Add Friend
                              </Button>
                            </HStack>
                          </CardBody>
                        </Card>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Friend Requests Panel */}
            <TabPanel>
              <VStack spacing={3} align="stretch">
                {friendRequests.length === 0 ? (
                  <Text textAlign="center" color="gray.500" py={8}>
                    No pending friend requests
                  </Text>
                ) : (
                  friendRequests.map((request) => (
                    <Card key={request._id} bg="blue.50" borderColor="blue.200">
                      <CardBody>
                        <HStack justify="space-between">
                          <HStack>
                            <Avatar 
                              src={request.from.profilePic} 
                              name={request.from.name}
                              size="md"
                            />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold">{request.from.name}</Text>
                              <Text fontSize="sm" color="gray.600">
                                Wants to be your friend
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                Code: {request.from.friendCode}
                              </Text>
                            </VStack>
                          </HStack>
                          <HStack>
                            <IconButton
                              icon={<CheckIcon />}
                              colorScheme="green"
                              size="sm"
                              onClick={() => acceptFriendRequest(request._id)}
                              aria-label="Accept request"
                            />
                            <IconButton
                              icon={<CloseIcon />}
                              colorScheme="red"
                              size="sm"
                              onClick={() => declineFriendRequest(request._id)}
                              aria-label="Decline request"
                            />
                          </HStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))
                )}
              </VStack>
            </TabPanel>

            {/* My Friends Panel */}
            <TabPanel>
              <VStack spacing={3} align="stretch">
                {friends.length === 0 ? (
                  <Text textAlign="center" color="gray.500" py={8}>
                    No friends yet. Add some using their friend codes!
                  </Text>
                ) : (
                  friends.map((friend) => (
                    <Card key={friend._id} _hover={{ shadow: "md" }} cursor="pointer">
                      <CardBody>
                        <HStack justify="space-between">
                          <HStack>
                            <Avatar 
                              src={friend.profilePic} 
                              name={friend.name}
                              size="md"
                            />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold">{friend.name}</Text>
                              <Text fontSize="sm" color="gray.600">
                                {friend.phoneNum}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                Code: {friend.friendCode}
                              </Text>
                            </VStack>
                          </HStack>
                          <Button
                            colorScheme="purple"
                            size="sm"
                            onClick={() => startChat(friend._id)}
                            rightIcon={<ChevronRightIcon />}
                          >
                            Chat
                          </Button>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default NewChats;
