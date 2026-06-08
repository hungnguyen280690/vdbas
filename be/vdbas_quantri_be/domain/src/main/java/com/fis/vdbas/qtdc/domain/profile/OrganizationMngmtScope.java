package com.fis.vdbas.qtdc.domain.profile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;

import java.time.LocalDateTime;
import java.util.UUID;
import com.fis.vdbas.qtdc.common.enums.ManageScopeType;

@Entity
@Table(name = "organization_mngmt_scope")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class OrganizationMngmtScope {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "manager_org_id", nullable = false)
    private UUID managerOrgId;

    @Column(name = "target_org_type", length = 50)
    private String targetOrgType;

    @Column(name = "target_org_id")
    private UUID targetOrgId;

    @Enumerated(EnumType.STRING)
    @Column(name = "manage_scope_type", length = 20)
    private ManageScopeType manageScopeType = ManageScopeType.DIRECT;

    @jakarta.persistence.Lob
    @Column(name = "description")
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.CLOB)
    private String description;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @CreatedBy
    @Column(name = "created_by", length = 50, updatable = false)
    private String createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_org_id", referencedColumnName = "id", insertable = false, updatable = false)
    private OrganizationProfile managerOrganization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_org_id", referencedColumnName = "id", insertable = false, updatable = false)
    private OrganizationProfile targetOrganization;
}
