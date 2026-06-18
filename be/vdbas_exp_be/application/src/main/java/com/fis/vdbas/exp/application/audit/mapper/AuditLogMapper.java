package com.fis.vdbas.exp.application.audit.mapper;

import com.fis.vdbas.exp.application.audit.dto.AuditLogEntryDto;
import com.fis.vdbas.exp.domain.audit.ExpAuditLog;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/** MapStruct mapper {@link ExpAuditLog} → DTO. */
@Mapper(componentModel = "spring")
public interface AuditLogMapper {

    /** userDisplayName lấy từ JWT (out-of-scope) — không có trong entity. */
    @Mapping(target = "userDisplayName", ignore = true)
    AuditLogEntryDto toDto(ExpAuditLog entity);

    List<AuditLogEntryDto> toDtoList(List<ExpAuditLog> entities);
}
