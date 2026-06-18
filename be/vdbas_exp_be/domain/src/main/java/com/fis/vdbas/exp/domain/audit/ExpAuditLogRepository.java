package com.fis.vdbas.exp.domain.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ExpAuditLogRepository extends JpaRepository<ExpAuditLog, UUID> {

    /** Lịch sử thay đổi của một bản ghi, mới nhất lên đầu. */
    Page<ExpAuditLog> findByTableNameAndRecordIdOrderByActionTimestampDesc(
            String tableName, String recordId, Pageable pageable);
}
