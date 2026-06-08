package com.fis.vdbas.qtdc.domain.user;

import com.fis.vdbas.common.domain.AbstractAuditingCreate;
import com.fis.vdbas.qtdc.domain.auth.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinColumns;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_role")
@IdClass(UserRoleId.class)
@Getter
@Setter
@ToString
@NoArgsConstructor
public class UserRole extends AbstractAuditingCreate<UserRoleId> {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(name = "app_code", length = 50)
    private String appCode;

    @Id
    @Column(name = "role_code", length = 50)
    private String roleCode;

    @Override
    public UserRoleId getId() {
        return new UserRoleId(userId, appCode, roleCode);
    }

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumns({
            @JoinColumn(name = "app_code", referencedColumnName = "app_code", insertable = false, updatable = false),
            @JoinColumn(name = "role_code", referencedColumnName = "role_code", insertable = false, updatable = false)
    })
    private Role role;
}
