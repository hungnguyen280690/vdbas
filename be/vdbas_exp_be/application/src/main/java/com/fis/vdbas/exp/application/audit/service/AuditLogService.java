package com.fis.vdbas.exp.application.audit.service;

import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.exp.application.audit.dto.AuditLogEntryDto;
import com.fis.vdbas.exp.application.audit.mapper.AuditLogMapper;
import com.fis.vdbas.exp.domain.audit.ExpAuditLog;
import com.fis.vdbas.exp.domain.audit.ExpAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/** Service tra cứu lịch sử thay đổi (EXP_AUDIT_LOG). */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AuditLogService {

    private static final String DOSSIER_TABLE = "EXP_DOSSIER";

    private final ExpAuditLogRepository repository;
    private final AuditLogMapper mapper;

    /** Audit log của một hồ sơ, mới nhất lên đầu. */
    public PageResponseDto<AuditLogEntryDto> getDossierAuditLog(UUID dossierId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ExpAuditLog> result = repository.findByTableNameAndRecordIdOrderByActionTimestampDesc(
                DOSSIER_TABLE, dossierId.toString(), pageable);
        return PageResponseDto.<AuditLogEntryDto>builder()
                .content(mapper.toDtoList(result.getContent()))
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();
    }
}
