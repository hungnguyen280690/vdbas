package com.fis.vdbas.qtdc.domain.profile;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationPersonRepository
                extends JpaRepository<OrganizationPerson, UUID>, JpaSpecificationExecutor<OrganizationPerson> {
        @EntityGraph(attributePaths = { "organization" })
        @Query("SELECT op FROM OrganizationPerson op WHERE op.personId = :personId AND op.main = 1 AND op.active = 1")
        Optional<OrganizationPerson> findByPersonIdAndMainTrueAndActiveTrue(@Param("personId") UUID personId);

        @EntityGraph(attributePaths = { "organization" })
        @Query("SELECT op FROM OrganizationPerson op WHERE op.personId IN :personIds AND op.main = 1 AND op.active = 1")
        List<OrganizationPerson> findAllByPersonIdInAndMainTrueAndActiveTrue(@Param("personIds") Collection<UUID> personIds);

        @EntityGraph(attributePaths = { "person", "organization" })
        @Query("SELECT op FROM OrganizationPerson op WHERE op.orgId = :orgId AND op.main = 1 AND op.active = 1")
        List<OrganizationPerson> findAllByOrgIdAndMainTrueAndActiveTrue(@Param("orgId") UUID orgId);

        @EntityGraph(attributePaths = { "person", "organization" })
        @Query("SELECT op FROM OrganizationPerson op JOIN op.organization org WHERE org.paths LIKE CONCAT(:pathPrefix, '%') AND op.main = 1 AND op.active = 1")
        List<OrganizationPerson> findAllByOrgPathStartingWithAndMainTrueAndActiveTrue(
                        @Param("pathPrefix") String pathPrefix);

        @EntityGraph(attributePaths = { "person", "organization" })
        @Query("SELECT op FROM OrganizationPerson op " +
                        "JOIN op.organization org " +
                        "WHERE org.paths LIKE CONCAT((SELECT o.paths FROM OrganizationProfile o WHERE o.id = :orgId), '%') "
                        +
                        "AND op.main = 1 AND op.active = 1")
        List<OrganizationPerson> findAllByHierarchy(@Param("orgId") UUID orgId);
}
