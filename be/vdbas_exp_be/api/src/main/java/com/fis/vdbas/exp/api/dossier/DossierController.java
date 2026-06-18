package com.fis.vdbas.exp.api.dossier;

import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.exp.application.dossier.dto.DeleteDossierRequest;
import com.fis.vdbas.exp.application.dossier.dto.DossierCreateRequest;
import com.fis.vdbas.exp.application.dossier.dto.DossierDetailDto;
import com.fis.vdbas.exp.application.dossier.dto.DossierMutationResult;
import com.fis.vdbas.exp.application.dossier.dto.DossierSearchDto;
import com.fis.vdbas.exp.application.dossier.dto.DossierSummaryDto;
import com.fis.vdbas.exp.application.dossier.dto.DossierUpdateRequest;
import com.fis.vdbas.exp.application.dossier.service.DossierService;
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
 * CRUD hồ sơ CAPEX — {@code /api/v1/exp/capex/dossiers}.
 * <p>TODO (out-of-scope): enforce role Maker + scope TREASURY_CODE từ JWT.</p>
 */
@RestController
@RequestMapping("/api/v1/exp/capex/dossiers")
@RequiredArgsConstructor
public class DossierController {

    private final DossierService service;

    /** GET danh sách hồ sơ (filter + phân trang). */
    @GetMapping
    public PageResponseDto<DossierSummaryDto> list(@ModelAttribute DossierSearchDto criteria) {
        return service.search(criteria);
    }

    /** GET chi tiết hồ sơ. */
    @GetMapping("/{dossierId}")
    public DossierDetailDto get(@PathVariable UUID dossierId) {
        return service.getDetail(dossierId);
    }

    /** POST tạo mới & lưu hồ sơ → SAVED (201). */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DossierMutationResult create(@Valid @RequestBody DossierCreateRequest body) {
        return service.create(body);
    }

    /** PUT cập nhật hồ sơ (optimistic lock qua version). */
    @PutMapping("/{dossierId}")
    public DossierMutationResult update(@PathVariable UUID dossierId,
            @Valid @RequestBody DossierUpdateRequest body) {
        return service.update(dossierId, body);
    }

    /** DELETE xoá mềm hồ sơ → CANCELLED. */
    @DeleteMapping("/{dossierId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID dossierId, @Valid @RequestBody DeleteDossierRequest body) {
        service.delete(dossierId, body);
    }
}
