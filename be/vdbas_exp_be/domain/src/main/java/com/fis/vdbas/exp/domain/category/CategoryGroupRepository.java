package com.fis.vdbas.exp.domain.category;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CategoryGroupRepository
        extends JpaRepository<CategoryGroup, String>, JpaSpecificationExecutor<CategoryGroup> {
    @Modifying
    @Query("UPDATE CategoryGroup e SET e.deleted = 1, e.active = 0 WHERE e.groupCode = :groupCode")
    void softDelete(@Param("groupCode") String groupCode);

    @Modifying
    @Query("UPDATE CategoryGroup e SET e.active = :active WHERE e.groupCode = :groupCode")
    void updateActive(@Param("groupCode") String groupCode, @Param("active") Integer active);

    Optional<CategoryGroup> findByGroupCodeAndDeleted(String groupCode, Integer deleted);

    List<CategoryGroup> findByDeletedOrderByGroupCodeAsc(Integer deleted);
}
