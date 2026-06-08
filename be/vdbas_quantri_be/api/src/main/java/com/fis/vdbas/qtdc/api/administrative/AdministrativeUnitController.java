package com.fis.vdbas.qtdc.api.administrative;

import com.fis.vdbas.qtdc.application.administrative.dto.AdministrativeUnitDto;
import com.fis.vdbas.qtdc.application.administrative.servcie.AdministrativeUnitService;
import com.fis.vdbas.qtdc.application.administrative.dto.AdministrativeUnitSearchDto;
import com.fis.vdbas.common.dto.PageResponseDto;
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
 * Controller for managing Administrative Units (Provinces, Districts, Wards).
 * <p>
 * Provides APIs for searching, creating, updating, and deleting administrative units.
 * </p>
 */
@RestController
@RequestMapping("/api/administrative-units")
@RequiredArgsConstructor
public class AdministrativeUnitController {

    private final AdministrativeUnitService service;

    /**
     * Searches for administrative units based on filter criteria.
     *
     * @param body Search criteria (e.g., name, code, level)
     * @return List of matching administrative units
     */
    @PostMapping("/search")
    public List<AdministrativeUnitDto> search(@Valid @RequestBody AdministrativeUnitSearchDto body) {
        return service.search(body);
    }

    /**
     * Retrieves details of a specific administrative unit.
     *
     * @param id Unit ID
     * @return Unit details
     */
    @GetMapping("/{id}")
    public AdministrativeUnitDto get(@PathVariable UUID id) {
        return service.get(id);
    }

    /**
     * Creates a new administrative unit.
     *
     * @param body Unit data
     * @return The created unit
     */
    @PostMapping
    public AdministrativeUnitDto create(@Valid @RequestBody AdministrativeUnitDto body) {
        return service.create(body);
    }

    /**
     * Updates an existing administrative unit.
     *
     * @param id   Unit ID
     * @param body Updated data
     * @return The updated unit
     */
    @PutMapping("/{id}")
    public AdministrativeUnitDto update(@PathVariable UUID id, @Valid @RequestBody AdministrativeUnitDto body) {
        return service.update(id, body);
    }

    /**
     * Toggles the active status of an administrative unit.
     *
     * @param id       Unit ID
     * @param isActive New status
     * @return The updated unit
     */
    @PutMapping("/{id}/active")
    public AdministrativeUnitDto updateActive(@PathVariable UUID id, @RequestBody Boolean isActive) {
        return service.updateActive(id, isActive);
    }

    /**
     * Soft-deletes an administrative unit.
     *
     * @param id Unit ID
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
