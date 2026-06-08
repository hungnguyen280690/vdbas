package com.fis.vdbas.qtdc.application.administrative.servcie;

import com.fis.vdbas.qtdc.application.administrative.dto.AdministrativeTransformationDto;
import com.fis.vdbas.qtdc.application.administrative.mapper.AdministrativeTransformationMapper;
import com.fis.vdbas.qtdc.domain.administrative.AdministrativeTransformation;
import com.fis.vdbas.qtdc.domain.administrative.AdministrativeTransformationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import static com.fis.vdbas.common.util.Constants.FLAG_FALSE;
import static com.fis.vdbas.common.util.Constants.FLAG_TRUE;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for handling Administrative Transformation logic.
 * <p>
 * Manages the relationships and metadata involved when administrative units
 * undergo structural changes like merges, splits, or renames.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdministrativeTransformationService {

    private final AdministrativeTransformationRepository repository;
    private final AdministrativeTransformationMapper mapper;

    /**
     * Retrieves all transformations where the specified ID is the target unit.
     *
     * @param targetId The ID of the target unit
     * @return List of transformation DTOs
     */
    public List<AdministrativeTransformationDto> getAllSourceId(UUID targetId) {
        return mapper.toDtoList(repository.findByTargetUnitId(targetId));
    }

    /**
     * Loads transformation details for a specific unit.
     *
     * @param id The ID of the unit
     * @return List of transformation records
     */
    public List<AdministrativeTransformationDto> load(UUID id) {
        return mapper.toDtoList(repository.findBySourceUnitIdAndTargetUnitId(id));
    }

    /**
     * Updates the transformation history for an administrative unit.
     * <p>
     * Synchronizes the set of source units associated with a target unit,
     * adding new links, deleting removed ones, and updating metadata for existing ones.
     * </p>
     *
     * @param targetId       The ID of the unit receiving the transformation
     * @param sourceIds      The list of source unit IDs
     * @param transformType  Type of transformation (e.g., Merge, Split)
     * @param decisionNumber Official decision or document number
     * @param effectiveDate  The date the transformation takes effect
     */
    @Transactional
    public void updateAdministrativeTransformation(UUID targetId, List<UUID> sourceIds,
            String transformType, String decisionNumber, LocalDateTime effectiveDate) {
        List<UUID> newSourceIds = sourceIds != null ? sourceIds : List.of();

        // 1. Get existing transformations
        List<AdministrativeTransformation> existingTransformations = repository.findByTargetUnitId(targetId);
        Set<UUID> existingSourceIds = existingTransformations.stream()
                .map(AdministrativeTransformation::getSourceUnitId)
                .collect(Collectors.toSet());

        // 2. Identify transformations to delete (existing but not in new list)
        List<AdministrativeTransformation> toDelete = existingTransformations.stream()
                .filter(at -> !newSourceIds.contains(at.getSourceUnitId()))
                .collect(Collectors.toList());

        if (!toDelete.isEmpty()) {
            repository.deleteAllInBatch(toDelete);
        }

        // 3. Identify transformations to add (new but not in existing list)
        List<AdministrativeTransformation> toAdd = newSourceIds.stream()
                .filter(sid -> !existingSourceIds.contains(sid))
                .map(sid -> {
                    AdministrativeTransformation at = new AdministrativeTransformation();
                    at.setTargetUnitId(targetId);
                    at.setSourceUnitId(sid);
                    at.setTransformationType(transformType);
                    at.setDecisionNumber(decisionNumber);
                    at.setEffectiveDate(effectiveDate);
                    return at;
                })
                .collect(Collectors.toList());

        if (!toAdd.isEmpty()) {
            repository.saveAll(toAdd);
        }

        // 4. Update existing transformations if metadata changed
        List<AdministrativeTransformation> toUpdate = existingTransformations.stream()
                .filter(at -> newSourceIds.contains(at.getSourceUnitId()))
                .filter(at -> !Objects.equals(at.getTransformationType(), transformType)
                        || !Objects.equals(at.getDecisionNumber(), decisionNumber)
                        || !Objects.equals(at.getEffectiveDate(), effectiveDate))
                .peek(at -> {
                    at.setTransformationType(transformType);
                    at.setDecisionNumber(decisionNumber);
                    at.setEffectiveDate(effectiveDate);
                })
                .collect(Collectors.toList());

        if (!toUpdate.isEmpty()) {
            repository.saveAll(toUpdate);
        }
    }

}
