package com.fis.vdbas.qtdc.application.profile.servcie;

import com.fis.vdbas.qtdc.application.profile.dto.OrganizationTransformationDto;
import com.fis.vdbas.qtdc.application.profile.mapper.OrganizationTransformationMapper;
import com.fis.vdbas.qtdc.domain.profile.OrganizationTransformation;
import com.fis.vdbas.qtdc.domain.profile.OrganizationTransformationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import static com.fis.vdbas.common.util.Constants.FLAG_FALSE;
import static com.fis.vdbas.common.util.Constants.FLAG_TRUE;
import java.util.stream.Collectors;

/**
 * Service for managing Organization Transformations.
 * <p>
 * Provides business logic for tracking historical changes to organizations,
 * such as mergers, splits, or administrative reassignments.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OrganizationTransformationService {

    private final OrganizationTransformationRepository repository;
    private final OrganizationTransformationMapper mapper;

    /**
     * Retrieves all transformation records where a specific organization is the target.
     *
     * @param targetId Target organization UUID
     * @return List of transformation DTOs
     */
    public List<OrganizationTransformationDto> getAllSourceId(UUID targetId) {
        return mapper.toDtoList(repository.findByTargetOrgId(targetId));
    }

    /**
     * Loads transformations for a specific organization ID.
     *
     * @param id Organization UUID
     * @return List of transformation DTOs
     */
    public List<OrganizationTransformationDto> load(UUID id) {
        return mapper.toDtoList(repository.findByTargetOrgId(id));
    }

    /**
     * Updates the set of transformation records for a target organization.
     * <p>
     * Synchronizes the database state with the provided list of source IDs,
     * adding new links, removing obsolete ones, and updating metadata for existing ones.
     * </p>
     *
     * @param targetId       Target organization UUID
     * @param sourceIds      List of source organization UUIDs
     * @param transformType  Type of transformation (e.g., MERGE, SPLIT)
     * @param decisionNumber Administrative decision reference
     * @param effectiveDate  Date when the transformation takes effect
     */
    @Transactional
    public void updateOrganizationTransformation(UUID targetId, List<UUID> sourceIds,
            String transformType, String decisionNumber, LocalDateTime effectiveDate) {
        List<UUID> newSourceIds = sourceIds != null ? sourceIds : List.of();

        // 1. Get existing transformations
        List<OrganizationTransformation> existingTransformations = repository.findByTargetOrgId(targetId);
        Set<UUID> existingSourceIds = existingTransformations.stream()
                .map(OrganizationTransformation::getSourceOrgId)
                .collect(Collectors.toSet());

        // 2. Identify transformations to delete (existing but not in new list)
        List<OrganizationTransformation> toDelete = existingTransformations.stream()
                .filter(ot -> !newSourceIds.contains(ot.getSourceOrgId()))
                .collect(Collectors.toList());

        if (!toDelete.isEmpty()) {
            repository.deleteAllInBatch(toDelete);
        }

        // 3. Identify transformations to add (new but not in existing list)
        List<OrganizationTransformation> toAdd = newSourceIds.stream()
                .filter(sid -> !existingSourceIds.contains(sid))
                .map(sid -> {
                    OrganizationTransformation ot = new OrganizationTransformation();
                    ot.setTargetOrgId(targetId);
                    ot.setSourceOrgId(sid);
                    ot.setTransformationType(transformType);
                    ot.setDecisionNumber(decisionNumber);
                    ot.setEffectiveDate(effectiveDate);
                    return ot;
                })
                .collect(Collectors.toList());

        if (!toAdd.isEmpty()) {
            repository.saveAll(toAdd);
        }

        // 4. Update existing transformations if metadata changed
        List<OrganizationTransformation> toUpdate = existingTransformations.stream()
                .filter(ot -> newSourceIds.contains(ot.getSourceOrgId()))
                .filter(ot -> !Objects.equals(ot.getTransformationType(), transformType)
                        || !Objects.equals(ot.getDecisionNumber(), decisionNumber)
                        || !Objects.equals(ot.getEffectiveDate(), effectiveDate))
                .peek(ot -> {
                    ot.setTransformationType(transformType);
                    ot.setDecisionNumber(decisionNumber);
                    ot.setEffectiveDate(effectiveDate);
                })
                .collect(Collectors.toList());

        if (!toUpdate.isEmpty()) {
            repository.saveAll(toUpdate);
        }
    }

    /**
     * Retrieves a specific transformation record by its ID.
     *
     * @param id Transformation record UUID
     * @return Transformation DTO
     */
    public OrganizationTransformationDto get(UUID id) {
        return mapper.toDto(repository.findById(id).orElseThrow());
    }

    /**
     * Creates a new transformation record.
     *
     * @param input Transformation data
     * @return The created transformation DTO
     */
    @Transactional
    public OrganizationTransformationDto create(OrganizationTransformationDto input) {
        OrganizationTransformation entity = mapper.toEntity(input);
        entity.setId(null);
        return mapper.toDto(repository.save(entity));
    }

    /**
     * Updates an existing transformation record.
     *
     * @param id    Transformation record UUID
     * @param input Updated data
     * @return The updated transformation DTO
     */
    @Transactional
    public OrganizationTransformationDto update(UUID id, OrganizationTransformationDto input) {
        OrganizationTransformation existing = repository.findById(id).orElseThrow();
        mapper.updateEntityFromDto(input, existing);
        return mapper.toDto(repository.save(existing));
    }

    /**
     * Deletes a transformation record.
     *
     * @param id Transformation record UUID to delete
     */
    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }
}
