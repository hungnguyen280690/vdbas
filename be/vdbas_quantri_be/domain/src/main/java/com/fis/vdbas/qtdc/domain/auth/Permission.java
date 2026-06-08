package com.fis.vdbas.qtdc.domain.auth;

import com.fis.vdbas.common.domain.AbstractAuditingCreate;
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
@Table(name = "permissions")
@IdClass(PermissionId.class)
@Getter
@Setter
@ToString
@NoArgsConstructor
public class Permission extends AbstractAuditingCreate<PermissionId> {

    @Id
    @Column(name = "app_code", length = 50)
    private String appCode;

    @Id
    @Column(name = "permission_code", length = 100)
    private String permissionCode;

    @Override
    public PermissionId getId() {
        return new PermissionId(appCode, permissionCode);
    }

    @Column(name = "permission_name", nullable = false, length = 255)
    private String permissionName;

    @Column(name = "permission_name_en", length = 255)
    private String permissionNameEn;

    @Column(name = "parent_code", length = 100)
    private String parentCode;

    @Column(name = "type", nullable = false, length = 20)
    private String type;

    @Column(name = "path", length = 255)
    private String path;

    @Column(name = "method", length = 10)
    private String method;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "app_code", referencedColumnName = "app_code", insertable = false, updatable = false)
    private Application application;
}
