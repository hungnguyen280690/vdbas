package com.fis.vdbas.qtdc.domain.profile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrganizationMngmtScopeRepository
        extends JpaRepository<OrganizationMngmtScope, UUID>, JpaSpecificationExecutor<OrganizationMngmtScope> {
    List<OrganizationMngmtScope> findByManagerOrgId(UUID managerOrgId);
}
