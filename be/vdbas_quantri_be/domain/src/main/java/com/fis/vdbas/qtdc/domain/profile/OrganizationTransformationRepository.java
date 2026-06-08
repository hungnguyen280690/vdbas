package com.fis.vdbas.qtdc.domain.profile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrganizationTransformationRepository extends JpaRepository<OrganizationTransformation, UUID> {
    List<OrganizationTransformation> findByTargetOrgId(UUID targetOrgId);

    List<OrganizationTransformation> findBySourceOrgId(UUID sourceOrgId);
}
