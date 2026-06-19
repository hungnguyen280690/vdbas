package com.fis.vdbas.exp.api.dossier;

import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.exp.application.dossier.dto.DeleteDossierRequest;
import com.fis.vdbas.exp.application.dossier.dto.DossierDetailDto;
import com.fis.vdbas.exp.application.dossier.dto.DossierMutationResult;
import com.fis.vdbas.exp.application.dossier.dto.DossierSearchDto;
import com.fis.vdbas.exp.application.dossier.dto.DossierSummaryDto;
import com.fis.vdbas.exp.application.dossier.dto.OpexDossierCreateRequest;
import com.fis.vdbas.exp.application.dossier.dto.OpexDossierDraftRequest;
import com.fis.vdbas.exp.application.dossier.dto.OpexDossierUpdateRequest;
import com.fis.vdbas.exp.application.dossier.dto.WorkflowActionResult;
import com.fis.vdbas.exp.application.dossier.service.OpexDossierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * CRUD + lưu nháp hồ sơ OPEX — {@code /api/v1/exp/opex/dossiers} (GAP-01/D1).
 * <p>Controller cô lập — KHÔNG đụng {@code DossierController} (CAPEX, {@code /exp/capex}).</p>
 * <p>TODO (out-of-scope): enforce role Maker + scope TREASURY_CODE từ JWT; Idempotency-Key.</p>
 */
@RestController
@RequestMapping("/api/v1/exp/opex/dossiers")
@RequiredArgsConstructor
public class OpexDossierController {

    private final OpexDossierService service;

    /** GET danh sách hồ sơ OPEX (filter + phân trang). */
    @GetMapping
    public PageResponseDto<DossierSummaryDto> list(@ModelAttribute DossierSearchDto criteria) {
        return service.search(criteria);
    }

    /** GET chi tiết hồ sơ. */
    @GetMapping("/{dossierId}")
    public DossierDetailDto get(@PathVariable UUID dossierId) {
        return service.getDetail(dossierId);
    }

    /** POST tạo mới hồ sơ OPEX → DRAFT (201). */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DossierMutationResult create(@Valid @RequestBody OpexDossierCreateRequest body) {
        return service.create(body);
    }

    /** POST lưu nháp (minimal validation) → DRAFT (201). */
    @PostMapping("/drafts")
    @ResponseStatus(HttpStatus.CREATED)
    public DossierMutationResult saveDraft(@Valid @RequestBody OpexDossierDraftRequest body) {
        return service.saveDraft(body);
    }

    /** PUT cập nhật hồ sơ (optimistic lock qua version). */
    @PutMapping("/{dossierId}")
    public DossierMutationResult update(@PathVariable UUID dossierId,
            @Valid @RequestBody OpexDossierUpdateRequest body) {
        return service.update(dossierId, body);
    }

    /** DELETE xoá mềm hồ sơ → DELETED (200, WorkflowActionResponse). */
    @DeleteMapping("/{dossierId}")
    public WorkflowActionResult delete(@PathVariable UUID dossierId,
            @Valid @RequestBody DeleteDossierRequest body) {
        return service.delete(dossierId, body);
    }
}
