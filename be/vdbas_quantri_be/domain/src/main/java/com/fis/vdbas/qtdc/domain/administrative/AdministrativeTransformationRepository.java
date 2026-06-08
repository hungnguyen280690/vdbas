package com.fis.vdbas.qtdc.domain.administrative;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AdministrativeTransformationRepository extends JpaRepository<AdministrativeTransformation, UUID> {

    @EntityGraph(attributePaths = { "sourceUnit", "targetUnit" })
    @Query("SELECT a FROM AdministrativeTransformation a WHERE a.sourceUnitId = :unitId OR a.targetUnitId = :unitId")
    List<AdministrativeTransformation> findBySourceUnitIdAndTargetUnitId(@Param("unitId") UUID unitId);

    List<AdministrativeTransformation> findByTargetUnitId(UUID unitId);

    List<AdministrativeTransformation> findBySourceUnitId(UUID unitId);
}
