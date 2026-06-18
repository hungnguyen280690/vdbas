package com.fis.vdbas.exp.api.dossier;

import com.fis.vdbas.exp.application.dossier.dto.DossierDraftRequest;
import com.fis.vdbas.exp.application.dossier.dto.DossierMutationResult;
import com.fis.vdbas.exp.application.dossier.service.DossierDraftService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Lưu nháp hồ sơ → DRAFT — {@code /api/v1/exp/capex/dossiers/drafts} (DEC-04). */
@RestController
@RequestMapping("/api/v1/exp/capex/dossiers/drafts")
@RequiredArgsConstructor
public class DossierDraftController {

    private final DossierDraftService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DossierMutationResult saveDraft(@Valid @RequestBody DossierDraftRequest body) {
        return service.saveDraft(body);
    }
}
