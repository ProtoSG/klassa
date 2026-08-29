package com.klassa.tenant;

import com.klassa.shared.web.ApiResponse;
import com.klassa.tenant.dto.RegisterTenantRequest;
import com.klassa.tenant.dto.TenantProvisionResponse;
import com.klassa.tenant.dto.TenantResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tenants")
@Tag(name = "Tenants")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
public class TenantController {

    private final TenantService tenantService;

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TenantProvisionResponse>> create(
            @Valid @RequestBody RegisterTenantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(tenantService.provisionWithAdmin(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TenantResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok(tenantService.findAll()));
    }

    @GetMapping("/{subdomain}")
    public ResponseEntity<ApiResponse<TenantResponse>> findBySubdomain(@PathVariable String subdomain) {
        return ResponseEntity.ok(ApiResponse.ok(tenantService.findBySubdomain(subdomain)));
    }

    @PatchMapping("/{subdomain}/status")
    public ResponseEntity<ApiResponse<TenantResponse>> updateStatus(
            @PathVariable String subdomain,
            @RequestParam TenantStatus status) {
        return ResponseEntity.ok(ApiResponse.ok(tenantService.updateStatus(subdomain, status)));
    }

    @PatchMapping("/{subdomain}/plan")
    public ResponseEntity<ApiResponse<TenantResponse>> updatePlan(
            @PathVariable String subdomain,
            @RequestParam Long planId) {
        return ResponseEntity.ok(ApiResponse.ok(tenantService.updatePlan(subdomain, planId)));
    }

    @DeleteMapping("/{subdomain}/data")
    public ResponseEntity<ApiResponse<TenantResponse>> purgeData(@PathVariable String subdomain) {
        return ResponseEntity.ok(ApiResponse.ok(tenantService.purgeData(subdomain)));
    }
}
