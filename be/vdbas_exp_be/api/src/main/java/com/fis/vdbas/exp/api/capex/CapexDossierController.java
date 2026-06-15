package com.fis.vdbas.exp.api.capex;

import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.exp.application.capex.dto.*;
import com.fis.vdbas.exp.application.capex.service.CapexDossierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/capex-dossier")
@RequiredArgsConstructor
public class CapexDossierController {

    private final CapexDossierService service;

    @GetMapping
    public PageResponseDto<DossierSummaryDto> search(
            @RequestParam(required = false) String dossierCode,
            @RequestParam(required = false) String projectCode,
            @RequestParam(required = false) String stateCode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        DossierSearchDto criteria = new DossierSearchDto();
        criteria.setDossierCode(dossierCode);
        criteria.setProjectCode(projectCode);
        criteria.setStateCode(stateCode);
        criteria.setFromDate(fromDate);
        criteria.setToDate(toDate);
        criteria.setPage(page);
        criteria.setSize(size);
        return service.search(criteria);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DossierHeaderDto create(@Valid @RequestBody DossierCreateRequestDto req) {
        return service.create(req);
    }

    @GetMapping("/{id}")
    public DossierDetailDto getDetail(@PathVariable UUID id) {
        return service.getDetailById(id);
    }

    @PutMapping("/{id}")
    public DossierHeaderDto update(@PathVariable UUID id,
                                   @Valid @RequestBody DossierUpdateRequestDto req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @Valid @RequestBody DeleteRequestDto req) {
        service.delete(id, req);
    }

    @PostMapping("/{id}/submit")
    public DossierHeaderDto submit(@PathVariable UUID id) {
        return service.submit(id);
    }

    @PostMapping("/{id}/workflow")
    public DossierHeaderDto workflow(@PathVariable UUID id,
                                     @Valid @RequestBody WorkflowActionRequestDto req) {
        return service.workflow(id, req);
    }

    @GetMapping("/{id}/documents")
    public List<DocumentDetailDto> getDocuments(@PathVariable UUID id) {
        return service.getDocuments(id);
    }

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public AttachmentInfoDto uploadAttachment(
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file,
            @RequestPart("archiveType") String archiveType,
            @RequestPart(value = "description", required = false) String description,
            @RequestPart(value = "archiveDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) String archiveDate) {
        LocalDate date = archiveDate != null ? LocalDate.parse(archiveDate) : null;
        return service.uploadAttachment(id, file, archiveType, description, date);
    }

    @DeleteMapping("/{id}/attachments/{archiveId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAttachment(@PathVariable UUID id, @PathVariable UUID archiveId) {
        service.deleteAttachment(id, archiveId);
    }

    @GetMapping("/{id}/attachments/{archiveId}/download")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable UUID id,
                                                        @PathVariable UUID archiveId) {
        Resource resource = service.downloadAttachment(id, archiveId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + resource.getFilename() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
}
