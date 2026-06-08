package com.fis.vdbas.qtdc.domain.auth;

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

import com.fis.vdbas.common.domain.AbstractAuditingCreate;

@Entity
@Table(name = "role_permission")
@IdClass(RolePermissionId.class)
@Getter
@Setter
@ToString
@NoArgsConstructor
public class RolePermission extends AbstractAuditingCreate<RolePermissionId> {

        @Id
        @Column(name = "app_code", length = 50)
        private String appCode;

        @Id
        @Column(name = "role_code", length = 50)
        private String roleCode;

        @Id
        @Column(name = "permission_code", length = 100)
        private String permissionCode;

        @Override
        public RolePermissionId getId() {
                return new RolePermissionId(appCode, roleCode, permissionCode);
        }

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumns({
                        @JoinColumn(name = "app_code", referencedColumnName = "app_code", insertable = false, updatable = false),
                        @JoinColumn(name = "role_code", referencedColumnName = "role_code", insertable = false, updatable = false)
        })
        private Role role;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumns({
                        @JoinColumn(name = "app_code", referencedColumnName = "app_code", insertable = false, updatable = false),
                        @JoinColumn(name = "permission_code", referencedColumnName = "permission_code", insertable = false, updatable = false)
        })
        private Permission permission;
}
