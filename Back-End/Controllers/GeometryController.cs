using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BasarsoftStaj.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GeometryController : ControllerBase
    {
        private readonly GeometryService _geometryService;

        public GeometryController(GeometryService geometryService)
        {
            _geometryService = geometryService;
        }

        [HttpGet("GetAll")]
        public async Task<ActionResult<Response<List<Geometry>>>> GetAllGeometries()
        {
            var response = await _geometryService.GetAllAsync();
            if (!response.Status)
            {
                return NotFound(response);
            }
            return Ok(response);
        }

        [HttpGet("GetById/{id}")]
        public async Task<ActionResult<Response<Geometry>>> GetById(long id)
        {
            var response = await _geometryService.GetByIdAsync(id);
            if (!response.Status)
            {
                return NotFound(response);
            }
            return Ok(response);
        }

        [HttpPost("Add")]
        public async Task<ActionResult<Response<Geometry>>> AddGeometry(Geometry geometry)
        {
            var response = await _geometryService.AddAsync(geometry);
            if (!response.Status)
            {
                return BadRequest(response);
            }
            return CreatedAtAction(nameof(GetById), new { id = geometry.Id }, response);
        }

        [HttpPut("Update")]
        public async Task<ActionResult<Response<Geometry>>> UpdateGeometry(Geometry geometry)
        {
            var response = await _geometryService.UpdateAsync(geometry);
            if (!response.Status)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpDelete("Delete/{id}")]
        public async Task<ActionResult<Response<Geometry>>> DeleteGeometry(long id)
        {
            var response = await _geometryService.DeleteAsync(id);
            if (!response.Status)
            {
                return NotFound(response);
            }
            return Ok(response);
        }
    }
}
