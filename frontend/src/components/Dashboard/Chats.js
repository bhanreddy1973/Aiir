import React, { useState } from "react";
import { 
  Tabs, 
  TabList, 
  Tab, 
  TabPanel, 
  TabPanels,
  Box 
} from "@chakra-ui/react";
import MyChatList from "./MyChatList";
import NewChats from "./NewChats";
import Groups from "./Groups";

const Chats = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (index) => {
    setActiveTab(index);
  };

  return (
    <>
      <Tabs
        isFitted
        variant="enclosed"
        w={{ base: "95vw", md: "100%" }}
        index={activeTab}
        onChange={handleTabChange}
        colorScheme="purple"
        h={"100%"}
      >
        <TabList>
          <Tab>My Chats</Tab>
          <Tab>Add Friends</Tab>
          <Tab>Groups</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel
            py={1}
            mt={{ base: 2, md: 0 }}
            px={2}
            w={{ base: "96vw", md: "29vw" }}
            borderRightWidth={{ base: "0px", md: "1px" }}
            h={{
              base: "85vh",
              md: "88.5vh",
            }}
          >
            <MyChatList setactiveTab={setActiveTab} />
          </TabPanel>
          <TabPanel
            mt={{ base: 2, md: 0 }}
            px={{ base: 0, md: 2 }}
            w={{ base: "96vw", md: "29vw" }}
            borderRightWidth={{ base: "0px", md: "1px" }}
            h={{ base: "80vh", md: "88.5vh" }}
          >
            <NewChats setactiveTab={setActiveTab} />
          </TabPanel>
          <TabPanel
            p={0}
            w={{ base: "96vw", md: "29vw" }}
            borderRightWidth={{ base: "0px", md: "1px" }}
            h={{ base: "85vh", md: "88.5vh" }}
          >
            <Groups />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
};

export default Chats;
