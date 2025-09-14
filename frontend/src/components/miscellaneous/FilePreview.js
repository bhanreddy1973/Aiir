import React from "react";
import {
  Box,
  Text,
  Image,
  Button,
  HStack,
  VStack,
  Icon,
  Badge,
  Link,
} from "@chakra-ui/react";
import { DownloadIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import {
  FaFile,
  FaFileImage,
  FaFileVideo,
  FaFileAudio,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileArchive,
  FaFileCode,
} from "react-icons/fa";

const FilePreview = ({ fileAttachment, imageUrl }) => {
  // Handle legacy imageUrl field
  if (imageUrl && !fileAttachment) {
    return (
      <Box maxW="300px" borderRadius="md" overflow="hidden">
        <Image
          src={imageUrl}
          alt="Image"
          maxH="200px"
          objectFit="cover"
          cursor="pointer"
          onClick={() => window.open(imageUrl, '_blank')}
        />
      </Box>
    );
  }

  if (!fileAttachment) return null;

  const { url, fileName, fileSize, mimeType } = fileAttachment;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return FaFileImage;
    if (mimeType?.startsWith('video/')) return FaFileVideo;
    if (mimeType?.startsWith('audio/')) return FaFileAudio;
    if (mimeType?.includes('pdf')) return FaFilePdf;
    if (mimeType?.includes('word') || mimeType?.includes('document')) return FaFileWord;
    if (mimeType?.includes('sheet') || mimeType?.includes('excel')) return FaFileExcel;
    if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) return FaFilePowerpoint;
    if (mimeType?.includes('zip') || mimeType?.includes('rar') || mimeType?.includes('archive')) return FaFileArchive;
    if (mimeType?.includes('javascript') || mimeType?.includes('json') || mimeType?.includes('html') || mimeType?.includes('css')) return FaFileCode;
    return FaFile;
  };

  const getFileColor = (mimeType) => {
    if (mimeType?.startsWith('image/')) return 'green';
    if (mimeType?.startsWith('video/')) return 'blue';
    if (mimeType?.startsWith('audio/')) return 'orange';
    if (mimeType?.includes('pdf')) return 'red';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return 'blue';
    if (mimeType?.includes('sheet') || mimeType?.includes('excel')) return 'green';
    if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) return 'orange';
    if (mimeType?.includes('zip') || mimeType?.includes('rar') || mimeType?.includes('archive')) return 'yellow';
    if (mimeType?.includes('javascript') || mimeType?.includes('json') || mimeType?.includes('html') || mimeType?.includes('css')) return 'purple';
    return 'gray';
  };

  // Handle images
  if (mimeType?.startsWith('image/')) {
    return (
      <Box maxW="300px" borderRadius="md" overflow="hidden" position="relative">
        <Image
          src={url}
          alt={fileName}
          maxH="200px"
          objectFit="cover"
          cursor="pointer"
          onClick={() => window.open(url, '_blank')}
        />
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          bg="blackAlpha.700"
          color="white"
          p={2}
          fontSize="sm"
        >
          <HStack justify="space-between">
            <Text isTruncated>{fileName}</Text>
            <Button
              size="xs"
              colorScheme="whiteAlpha"
              as={Link}
              href={url}
              download={fileName}
              leftIcon={<DownloadIcon />}
            >
              Download
            </Button>
          </HStack>
        </Box>
      </Box>
    );
  }

  // Handle videos
  if (mimeType?.startsWith('video/')) {
    return (
      <Box maxW="400px" borderRadius="md" overflow="hidden">
        <video
          controls
          style={{ width: '100%', maxHeight: '250px' }}
          preload="metadata"
        >
          <source src={url} type={mimeType} />
          Your browser does not support the video tag.
        </video>
        <Box bg="gray.100" p={3}>
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" fontWeight="semibold" isTruncated>
                {fileName}
              </Text>
              <Text fontSize="xs" color="gray.600">
                {formatFileSize(fileSize)}
              </Text>
            </VStack>
            <Button
              size="sm"
              colorScheme="blue"
              as={Link}
              href={url}
              download={fileName}
              leftIcon={<DownloadIcon />}
            >
              Download
            </Button>
          </HStack>
        </Box>
      </Box>
    );
  }

  // Handle audio files
  if (mimeType?.startsWith('audio/')) {
    return (
      <Box maxW="350px" borderRadius="md" border="1px" borderColor="gray.200" p={3}>
        <VStack spacing={3}>
          <HStack w="100%">
            <Icon as={FaFileAudio} color="orange.500" boxSize={6} />
            <VStack align="start" spacing={0} flex={1}>
              <Text fontSize="sm" fontWeight="semibold" isTruncated>
                {fileName}
              </Text>
              <Text fontSize="xs" color="gray.600">
                {formatFileSize(fileSize)}
              </Text>
            </VStack>
            <Badge colorScheme="orange">Audio</Badge>
          </HStack>
          <audio controls style={{ width: '100%' }}>
            <source src={url} type={mimeType} />
            Your browser does not support the audio tag.
          </audio>
          <Button
            size="sm"
            colorScheme="orange"
            as={Link}
            href={url}
            download={fileName}
            leftIcon={<DownloadIcon />}
            w="100%"
          >
            Download
          </Button>
        </VStack>
      </Box>
    );
  }

  // Handle other file types
  return (
    <Box
      maxW="350px"
      borderRadius="md"
      border="1px"
      borderColor="gray.200"
      p={4}
      bg="gray.50"
      _hover={{ bg: "gray.100" }}
    >
      <HStack spacing={4}>
        <Icon
          as={getFileIcon(mimeType)}
          color={`${getFileColor(mimeType)}.500`}
          boxSize={8}
        />
        <VStack align="start" spacing={1} flex={1}>
          <Text fontSize="sm" fontWeight="semibold" isTruncated>
            {fileName}
          </Text>
          <Text fontSize="xs" color="gray.600">
            {formatFileSize(fileSize)}
          </Text>
          <Badge colorScheme={getFileColor(mimeType)} size="sm">
            {mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
          </Badge>
        </VStack>
        <VStack spacing={1}>
          <Button
            size="sm"
            colorScheme={getFileColor(mimeType)}
            as={Link}
            href={url}
            target="_blank"
            leftIcon={<ExternalLinkIcon />}
          >
            Open
          </Button>
          <Button
            size="sm"
            variant="outline"
            colorScheme={getFileColor(mimeType)}
            as={Link}
            href={url}
            download={fileName}
            leftIcon={<DownloadIcon />}
          >
            Download
          </Button>
        </VStack>
      </HStack>
    </Box>
  );
};

export default FilePreview;