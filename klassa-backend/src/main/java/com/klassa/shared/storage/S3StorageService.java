package com.klassa.shared.storage;

import jakarta.annotation.PostConstruct;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

@Service
public class S3StorageService implements StorageService {

    private static final int THUMB_SIZE = 150;
    private static final int FULL_SIZE  = 800;
    private static final double QUALITY = 0.85;

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final String bucket;

    public S3StorageService(S3Client s3Client, S3Presigner s3Presigner,
                            @Value("${storage.bucket}") String bucket) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.bucket = bucket;
    }

    @PostConstruct
    void ensureBucketExists() {
        boolean exists = s3Client.listBuckets().buckets().stream()
                .anyMatch(b -> b.name().equals(bucket));
        if (!exists) {
            s3Client.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
        }
    }

    /**
     * Uploads thumb (150×150) and full (800×800) variants.
     * Returns the base key without extension — callers append _thumb.jpg / _full.jpg.
     */
    @Override
    public String upload(String folder, MultipartFile file) {
        String baseKey = folder + "/" + UUID.randomUUID();
        try {
            putVariant(file, baseKey + "_thumb.jpg", THUMB_SIZE);
            putVariant(file, baseKey + "_full.jpg",  FULL_SIZE);
        } catch (IOException e) {
            throw new StorageException("Failed to upload image variants", e);
        }
        return baseKey;
    }

    /** Deletes both variants for a base key, or a single legacy key with extension. */
    @Override
    public void delete(String key) {
        if (key == null) return;
        if (isLegacyKey(key)) {
            deleteObject(key);
        } else {
            deleteObject(key + "_thumb.jpg");
            deleteObject(key + "_full.jpg");
        }
    }

    @Override
    public String presign(String key, Duration ttl) {
        GetObjectPresignRequest request = GetObjectPresignRequest.builder()
                .signatureDuration(ttl)
                .getObjectRequest(GetObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .build())
                .build();
        return s3Presigner.presignGetObject(request).url().toString();
    }

    private void putVariant(MultipartFile file, String key, int maxDimension) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Thumbnails.of(file.getInputStream())
                .size(maxDimension, maxDimension)
                .outputFormat("jpg")
                .outputQuality(QUALITY)
                .toOutputStream(out);
        byte[] bytes = out.toByteArray();
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType("image/jpeg")
                        .contentLength((long) bytes.length)
                        .build(),
                RequestBody.fromBytes(bytes));
    }

    private void deleteObject(String key) {
        s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
    }

    public static boolean isLegacyKey(String key) {
        String lower = key.toLowerCase();
        return lower.endsWith(".jpg") || lower.endsWith(".jpeg")
                || lower.endsWith(".png") || lower.endsWith(".webp");
    }
}
