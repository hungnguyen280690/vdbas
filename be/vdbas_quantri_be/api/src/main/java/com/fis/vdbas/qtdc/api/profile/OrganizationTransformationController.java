package com.fis.vdbas.qtdc.api.profile;

import com.fis.vdbas.qtdc.application.profile.dto.OrganizationTransformationDto;
import com.fis.vdbas.qtdc.application.profile.servcie.OrganizationTransformationService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Controller for managing Organization Transformations (mergers, splits, renames).
 * <p>
 * Tracks the history and lineage of organizations as they evolve or change structure.
 * </p>
 */
@RestController
@RequestMapping("/api/organization-transformations")
@RequiredArgsConstructor
public class OrganizationTransformationController {

    private final OrganizationTransformationService service;

    /**
     * Loads transformation details for a specific organization.
     *
     * @param id Organization UUID
     * @return List of transformation records
     */
    @GetMapping("/load/{id}")
    public List<OrganizationTransformationDto> load(@PathVariable UUID id) {
        return service.load(id);
    }

    /**
     * Retrieves all source organizations involved in a transformation for a target organization.
     *
     * @param id Target organization UUID
     * @return List of transformation source records
     */
    @GetMapping("/all-source/{id}")
    public List<OrganizationTransformationDto> getAllSourceId(@PathVariable UUID id) {
        return service.getAllSourceId(id);
    }

    /**
     * Retrieves details of a specific transformation record.
     *
     * @param id Transformation record UUID
     * @return Transformation details
     */
    @GetMapping("/{id}")
    public OrganizationTransformationDto get(@PathVariable UUID id) {
        return service.get(id);
    }

    /**
     * Creates a new organization transformation record.
     *
     * @param body Transformation data
     * @return The created record
     */
    @PostMapping
    public OrganizationTransformationDto create(@Valid @RequestBody OrganizationTransformationDto body) {
        return service.create(body);
    }

    /**
     * Updates an existing transformation record.
     *
     * @param id   Transformation record UUID
     * @param body Updated data
     * @return The updated record
     */
    @PutMapping("/{id}")
    public OrganizationTransformationDto update(@PathVariable UUID id,
            @Valid @RequestBody OrganizationTransformationDto body) {
        return service.update(id, body);
    }

    /**
     * Deletes a transformation record.
     *
     * @param id Transformation record UUID
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
