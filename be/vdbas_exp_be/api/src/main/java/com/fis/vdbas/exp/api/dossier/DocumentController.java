package com.fis.vdbas.exp.api.dossier;

import com.fis.vdbas.exp.application.dossier.dto.AddDocumentRequest;
import com.fis.vdbas.exp.application.dossier.dto.DocumentDetailDto;
import com.fis.vdbas.exp.application.dossier.dto.DocumentSummaryDto;
import com.fis.vdbas.exp.application.dossier.dto.UpdateDocumentRequest;
import com.fis.vdbas.exp.application.dossier.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/** Chứng từ trong hồ sơ — {@code /api/v1/exp/capex/dossiers/{dossierId}/documents}. */
@RestController
@RequestMapping("/api/v1/exp/capex/dossiers/{dossierId}/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService service;

    @GetMapping
    public List<DocumentSummaryDto> list(@PathVariable UUID dossierId) {
        return service.list(dossierId);
    }

    @GetMapping("/{documentId}")
    public DocumentDetailDto get(@PathVariable UUID dossierId, @PathVariable UUID documentId) {
        return service.get(dossierId, documentId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentDetailDto add(@PathVariable UUID dossierId, @Valid @RequestBody AddDocumentRequest body) {
        return service.add(dossierId, body);
    }

    @PutMapping("/{documentId}")
    public DocumentDetailDto update(@PathVariable UUID dossierId, @PathVariable UUID documentId,
            @Valid @RequestBody UpdateDocumentRequest body) {
        return service.update(dossierId, documentId, body);
    }

    @DeleteMapping("/{documentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable UUID dossierId, @PathVariable UUID documentId) {
        service.remove(dossierId, documentId);
    }
}
