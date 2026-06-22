package com.tutorschool.backend.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String saveQrCode(MultipartFile file);
    void deleteFile(String filePath);
}
