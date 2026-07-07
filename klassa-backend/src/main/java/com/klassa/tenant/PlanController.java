package com.klassa.tenant;

import com.klassa.tenant.dto.PlanResponse;
import com.klassa.shared.web.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/plans")
@Tag(name = "Plans")
public class PlanController {

    private final PlanRepository planRepository;

    public PlanController(PlanRepository planRepository) {
        this.planRepository = planRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PlanResponse>>> findAll() {
        List<PlanResponse> plans = planRepository.findAllByActiveTrue().stream()
                .map(p -> new PlanResponse(p.getId(), p.getName(), p.getMaxStudents(),
                        p.getPriceMonthly(), p.getFeatures(), p.getActive()))
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(plans));
    }
}
