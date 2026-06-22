package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageServiceImpl implements FileStorageService {

    private static final Path QR_UPLOAD_DIR = Paths.get("uploads/students/qr");
    private static final Set<String> ALLOWED_TYPES = Set.of("image/png", "image/jpeg", "image/jpg");
    private static final long MAX_SIZE = 3L * 1024 * 1024;

    @Override
    public String saveQrCode(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("ไฟล์ต้องเป็นรูปภาพ PNG หรือ JPG เท่านั้น");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException("ขนาดไฟล์ต้องไม่เกิน 3MB");
        }

        try {
            Files.createDirectories(QR_UPLOAD_DIR);

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            }

            String filename = UUID.randomUUID() + extension;
            Path targetPath = QR_UPLOAD_DIR.resolve(filename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String path = "/uploads/students/qr/" + filename;
            log.info("QR code saved: {}", path);
            return path;
        } catch (IOException e) {
            log.error("Failed to save QR code file", e);
            throw new RuntimeException("ไม่สามารถบันทึกไฟล์ QR Code ได้");
        }
    }

    @Override
    public void deleteFile(String filePath) {
        if (filePath == null || filePath.isBlank()) return;
        try {
            Path path = Paths.get("." + filePath);
            Files.deleteIfExists(path);
            log.info("Deleted file: {}", filePath);
        } catch (IOException e) {
            log.warn("Failed to delete file: {}", filePath, e);
        }
    }
}
