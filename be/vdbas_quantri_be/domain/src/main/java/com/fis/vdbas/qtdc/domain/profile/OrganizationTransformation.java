package com.fis.vdbas.qtdc.domain.profile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

import java.time.LocalDateTime;
import java.util.UUID;

import com.fis.vdbas.common.domain.AbstractAuditingCreate;

@Entity
@Table(name = "organization_transformations")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class OrganizationTransformation extends AbstractAuditingCreate<UUID> {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "source_org_id", nullable = false)
    private UUID sourceOrgId;

    @Column(name = "target_org_id", nullable = false)
    private UUID targetOrgId;

    @Column(name = "transformation_type", length = 20)
    private String transformationType;

    @Column(name = "effective_date", nullable = false)
    private LocalDateTime effectiveDate;

    @Column(name = "decision_number", length = 100)
    private String decisionNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_org_id", referencedColumnName = "id", insertable = false, updatable = false)
    private OrganizationProfile sourceOrganization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_org_id", referencedColumnName = "id", insertable = false, updatable = false)
    private OrganizationProfile targetOrganization;
}
