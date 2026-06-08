package com.fis.vdbas.qtdc.domain.profile;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationProfileRepository
        extends JpaRepository<OrganizationProfile, UUID>, JpaSpecificationExecutor<OrganizationProfile> {

    @EntityGraph(attributePaths = { "parent", "administrativeUnit" })
    Optional<OrganizationProfile> findById(UUID id);

    // @Override
    // @EntityGraph(attributePaths = { "parent", "administrativeUnit" })
    // List<OrganizationProfile> findAll();

    // @Override
    // @EntityGraph(attributePaths = { "parent", "administrativeUnit" })
    // List<OrganizationProfile> findAll(Specification<OrganizationProfile> spec,
    // Sort sort);

    // @Override
    // @EntityGraph(attributePaths = { "parent", "administrativeUnit" })
    // Page<OrganizationProfile> findAll(Specification<OrganizationProfile> spec,
    // Pageable pageable);

    @Modifying
    @Query("UPDATE OrganizationProfile e SET e.deleted = 1, e.active = 0, e.endDate = CURRENT_TIMESTAMP WHERE e.id = :id")
    void softDelete(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE OrganizationProfile e SET e.active = :active WHERE e.id = :id")
    void updateActive(@Param("id") UUID id, @Param("active") Integer active);

    @Query("SELECT e.paths FROM OrganizationProfile e WHERE e.id = :id")
    String findPathsById(@Param("id") UUID id);

    @Query("SELECT o FROM OrganizationProfile o WHERE o.orgCode = :orgCode AND o.deleted = 0")
    Optional<OrganizationProfile> findByOrgCodeAndDeletedFalse(@Param("orgCode") String orgCode);

    @Query("SELECT o FROM OrganizationProfile o WHERE o.orgType = :orgType AND o.deleted = 0")
    List<OrganizationProfile> findByOrgTypeAndDeletedFalse(@Param("orgType") String orgType);
    
    @Query("SELECT o FROM OrganizationProfile o WHERE o.parentId IS NULL AND o.deleted = 0")
    List<OrganizationProfile> findByParentIdIsNullAndDeletedFalse();


    @Query(value = "SELECT DISTINCT op.* " +
            "FROM organization_profiles op " +
            "INNER JOIN organization_profiles target ON target.paths LIKE CONCAT(op.paths, '%') " +
            "WHERE op.is_deleted = 0 " +
            "  AND target.is_deleted = 0 " +
            "  AND LOWER(target.org_name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "  AND EXISTS ( " +
            "      SELECT 1 FROM organization_issuing_agency oia " +
            "      INNER JOIN organization_profiles sub ON oia.org_id = sub.id " +
            "      WHERE sub.is_deleted = 0 " +
            "        AND sub.paths LIKE CONCAT(target.paths, '%') " +
            "  )", nativeQuery = true)
    List<OrganizationProfile> searchActiveTreeByKeyword(@Param("keyword") String keyword);

    @Query(value = "SELECT DISTINCT op.* FROM organization_profiles op " +
            "INNER JOIN organization_profiles sub ON sub.paths LIKE CONCAT(op.paths, '%') " +
            "WHERE op.parent_id = :parentId " +
            "  AND op.is_deleted = 0 " +
            "  AND sub.is_deleted = 0 " +
            "  AND EXISTS ( " +
            "      SELECT 1 FROM organization_issuing_agency oia " +
            "      WHERE oia.org_id = sub.id " +
            "  )", nativeQuery = true)
    List<OrganizationProfile> findValidDirectChildren(@Param("parentId") UUID parentId);

    @Query(value = "SELECT parent.id AS parent_id, COUNT(DISTINCT sub_oia.org_id) AS child_count " +
            "FROM organization_profiles parent " +
            "INNER JOIN organization_profiles child ON child.paths LIKE CONCAT(parent.paths, '/%') " +
            "INNER JOIN organization_issuing_agency sub_oia ON child.id = sub_oia.org_id " +
            "WHERE parent.id IN (:parentIds) " +
            "  AND parent.is_deleted = 0 " +
            "  AND child.is_deleted = 0 " +
            "GROUP BY parent.id", nativeQuery = true)
    List<Object[]> countValidChildrenForParentIds(@Param("parentIds") List<UUID> parentIds);
}
