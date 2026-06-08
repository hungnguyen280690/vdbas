package com.fis.vdbas.exp.api.capex;

import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.exp.application.capex.dto.CapexDossierDto;
import com.fis.vdbas.exp.application.capex.dto.CapexDossierSearchDto;
import com.fis.vdbas.exp.application.capex.dto.DocumentDetailDto;
import com.fis.vdbas.exp.application.capex.dto.DossierDeleteDto;
import com.fis.vdbas.exp.application.capex.dto.DossierDetailDto;
import com.fis.vdbas.exp.application.capex.dto.DossierHeaderDto;
import com.fis.vdbas.exp.application.capex.dto.DossierSummaryDto;
import com.fis.vdbas.exp.application.capex.dto.WorkflowActionDto;
import com.fis.vdbas.exp.application.capex.service.CapexDossierService;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/capex-dossier")
@RequiredArgsConstructor
public class CapexDossierController {

    private final CapexDossierService service;

    /**
     * GET /api/v1/capex-dossier — paginated search with optional filters via query params.
     */
    @GetMapping
    public PageResponseDto<DossierSummaryDto> search(@ModelAttribute CapexDossierSearchDto criteria) {
        return service.search(criteria);
    }

    /**
     * GET /api/v1/capex-dossier/{id} — get full dossier detail (documents, attachments, history).
     */
    @GetMapping("/{id}")
    public DossierDetailDto get(@PathVariable UUID id) {
        return service.get(id);
    }

    /**
     * POST /api/v1/capex-dossier — create a new dossier in DRAFT status.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DossierHeaderDto create(@Valid @RequestBody CapexDossierDto body) {
        return service.create(body);
    }

    /**
     * PUT /api/v1/capex-dossier/{id} — update header fields; only allowed in DRAFT state.
     */
    @PutMapping("/{id}")
    public DossierHeaderDto update(@PathVariable UUID id, @Valid @RequestBody CapexDossierDto body) {
        return service.update(id, body);
    }

    /**
     * DELETE /api/v1/capex-dossier/{id} — soft-delete; only allowed in DRAFT state.
     * Requires deleteReason (≥10 chars) and confirmReviewed=true.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @Valid @RequestBody DossierDeleteDto body) {
        service.delete(id, body);
    }

    /**
     * POST /api/v1/capex-dossier/{id}/submit — transition DRAFT → PENDING_CHECK.
     */
    @PostMapping("/{id}/submit")
    public void submit(@PathVariable UUID id) {
        service.submit(id);
    }

    /**
     * POST /api/v1/capex-dossier/{id}/workflow — workflow actions: CHECK, APPROVE, REJECT, RETURN.
     */
    @PostMapping("/{id}/workflow")
    public void executeWorkflow(@PathVariable UUID id, @Valid @RequestBody WorkflowActionDto body) {
        service.executeWorkflow(id, body);
    }

    /**
     * GET /api/v1/capex-dossier/{id}/documents — list documents (with lines) for a dossier.
     */
    @GetMapping("/{id}/documents")
    public List<DocumentDetailDto> getDocuments(@PathVariable UUID id) {
        return service.getDocuments(id);
    }
}
