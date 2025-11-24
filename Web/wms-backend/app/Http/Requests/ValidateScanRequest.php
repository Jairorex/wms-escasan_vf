<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ValidateScanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tarea_id' => 'required|integer|exists:tareas,id',
            'tipo_escaneo' => 'required|string|in:location,lot,quantity',
            'valor' => 'required|string',
            'cantidad' => 'nullable|numeric|min:0.01|required_if:tipo_escaneo,quantity',
        ];
    }

    public function messages(): array
    {
        return [
            'tarea_id.required' => 'El ID de la tarea es requerido',
            'tarea_id.exists' => 'La tarea no existe',
            'tipo_escaneo.required' => 'El tipo de escaneo es requerido',
            'tipo_escaneo.in' => 'El tipo de escaneo debe ser: location, lot o quantity',
            'valor.required' => 'El valor del escaneo es requerido',
            'cantidad.required_if' => 'La cantidad es requerida cuando el tipo de escaneo es quantity',
            'cantidad.numeric' => 'La cantidad debe ser un número',
            'cantidad.min' => 'La cantidad debe ser mayor a 0',
        ];
    }
}

