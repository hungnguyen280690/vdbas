package com.fis.vdbas.qtdc.domain.auth;

import com.fis.vdbas.common.domain.AbstractAuditing;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "roles")
@IdClass(RoleId.class)
@Getter
@Setter
@ToString
@NoArgsConstructor
public class Role extends AbstractAuditing<RoleId> {

    @Id
    @Column(name = "app_code", length = 50)
    private String appCode;

    @Id
    @Column(name = "role_code", length = 50)
    private String roleCode;

    @Override
    public RoleId getId() {
        return new RoleId(appCode, roleCode);
    }

    @Column(name = "role_name", nullable = false, length = 255)
    private String roleName;

    @Column(name = "is_deleted", nullable = false)
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.NUMERIC)
    private Integer deleted = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "app_code", referencedColumnName = "app_code", insertable = false, updatable = false)
    private Application application;
}
