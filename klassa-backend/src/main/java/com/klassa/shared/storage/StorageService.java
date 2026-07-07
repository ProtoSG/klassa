package com.klassa.shared.storage;

import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;

public interface StorageService {
    String upload(String folder, MultipartFile file);
    void delete(String key);
    String presign(String key, Duration ttl);
}
