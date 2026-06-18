package com.fis.vdbas.exp.domain.dossier;

import com.fis.vdbas.exp.domain.base.ExpAuditing;
import com.fis.vdbas.exp.common.converter.ActionRoleConverter;
import com.fis.vdbas.exp.common.enums.ActionRole;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Một bước trong luồng phê duyệt — map bảng {@code EXP_APPROVAL_LOG}.
 * <p>DEC-07: cột {@code ACTION_USER_NAME} (họ tên từ JWT) cần ALTER DDL trước khi chạy.</p>
 * <p>DEC-03: {@code reason} NOT NULL — bắt buộc cả khi approve.</p>
 */
@Entity
@Table(name = "EXP_APPROVAL_LOG")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class ExpApprovalLog extends ExpAuditing<UUID> {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Override
    public UUID getId() {
        return this.id;
    }

    @Column(name = "DOSSIER_ID", nullable = false)
    private UUID dossierId;

    @Column(name = "DOSSIER_CODE", nullable = false, length = 100)
    private String dossierCode;

    @Column(name = "ACTION_USER", nullable = false, length = 100)
    private String actionUser;

    /** DEC-07: cột mới — họ tên lấy từ JWT claim displayName (out-of-scope nguồn claim). */
    @Column(name = "ACTION_USER_NAME", length = 500)
    private String actionUserName;

    @Convert(converter = ActionRoleConverter.class)
    @Column(name = "ACTION_ROLE", nullable = false, length = 100)
    private ActionRole actionRole;

    @Column(name = "ACTION_DATE", nullable = false)
    private LocalDateTime actionDate;

    @Column(name = "REASON", nullable = false, length = 2000)
    private String reason;

    @Column(name = "STATE_CODE", nullable = false, length = 100)
    private String stateCode;

    @Column(name = "PARENT_ID")
    private UUID parentId;
}
