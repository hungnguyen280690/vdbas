package com.fis.vdbas.exp.domain.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Dòng nhật ký thay đổi — map bảng {@code EXP_AUDIT_LOG}.
 * <p>NOTE-05: append-only, KHÔNG extend {@code AbstractAuditing}; set {@code actionTimestamp}
 * bằng {@code @PrePersist}. Không có thao tác update.</p>
 */
@Entity
@Table(name = "EXP_AUDIT_LOG")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class ExpAuditLog {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "TABLE_NAME", nullable = false, length = 100)
    private String tableName;

    @Column(name = "RECORD_ID", nullable = false, length = 100)
    private String recordId;

    @Column(name = "ACTION_TYPE", nullable = false, length = 100)
    private String actionType;

    @Lob
    @Column(name = "OLD_VALUE")
    private String oldValue;

    @Lob
    @Column(name = "NEW_VALUE", nullable = false)
    private String newValue;

    @Column(name = "USER_ID", nullable = false, length = 100)
    private String userId;

    @Column(name = "ACTION_TIMESTAMP", nullable = false)
    private LocalDateTime actionTimestamp;

    @Column(name = "IP_ADDRESS", nullable = false, length = 100)
    private String ipAddress;

    @PrePersist
    void onPersist() {
        if (this.actionTimestamp == null) {
            this.actionTimestamp = LocalDateTime.now();
        }
    }
}
