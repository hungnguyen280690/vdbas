package com.fis.vdbas.exp.api.audit;

import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.exp.application.audit.dto.AuditLogEntryDto;
import com.fis.vdbas.exp.application.audit.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Lịch sử thay đổi (audit-log) — {@code /api/v1/exp/capex/dossiers/{dossierId}/audit-log}. */
@RestController
@RequestMapping("/api/v1/exp/capex/dossiers/{dossierId}/audit-log")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogService service;

    @GetMapping
    public PageResponseDto<AuditLogEntryDto> auditLog(
            @PathVariable UUID dossierId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.getDossierAuditLog(dossierId, page, size);
    }
}
