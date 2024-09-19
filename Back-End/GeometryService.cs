using Microsoft.EntityFrameworkCore;

namespace BasarsoftStaj
{
    public class GeometryService
    {
        private readonly dbContext _context;

        public GeometryService(dbContext context)
        {
            _context = context;
        }

        // Tüm geometrileri getirir
        public async Task<Response<List<Geometry>>> GetAllAsync()
        {
            try
            {
                var geometries = await _context.Geometries.ToListAsync();
                if (geometries == null || geometries.Count == 0)
                {
                    return new Response<List<Geometry>>(false, "No geometries found", new List<Geometry>());
                }
                return new Response<List<Geometry>>(true, "Geometries retrieved successfully", geometries);
            }
            catch (Exception ex)
            {
                return new Response<List<Geometry>>(false, $"An error occurred: {ex.Message}", new List<Geometry>());
            }
        }

        // Belirli bir geometriyi Id ile getirir
        public async Task<Response<Geometry>> GetByIdAsync(long id)
        {
            try
            {
                var geometry = await _context.Geometries.FindAsync(id);
                if (geometry == null)
                {
                    return new Response<Geometry>(false, $"The Geometry with Id {id} cannot be found", null);
                }
                return new Response<Geometry>(true, "Geometry retrieved successfully", geometry);
            }
            catch (Exception ex)
            {
                return new Response<Geometry>(false, $"An error occurred: {ex.Message}", null);
            }
        }

        // Yeni geometri ekler
        public async Task<Response<Geometry>> AddAsync(Geometry geometry)
        {
            try
            {
                if (!await _context.Geometries.AnyAsync())
                {
                    await ResetIdSequence();
                }

                await _context.Geometries.AddAsync(geometry);
                await _context.SaveChangesAsync();
                return new Response<Geometry>(true, "The Geometry successfully added", geometry);
            }
            catch (Exception ex)
            {
                return new Response<Geometry>(false, $"An error occurred: {ex.Message}", null);
            }
        }

        // Geometri günceller
        public async Task<Response<Geometry>> UpdateAsync(Geometry geometry)
        {
            try
            {
                var existingGeometry = await _context.Geometries.FindAsync(geometry.Id);
                if (existingGeometry == null)
                {
                    return new Response<Geometry>(false, $"The Geometry with Id {geometry.Id} cannot be found", null);
                }

                existingGeometry.Wkt = geometry.Wkt;  // Geometriyi WKT formatında güncelle
                existingGeometry.Name = geometry.Name;

                await _context.SaveChangesAsync();
                return new Response<Geometry>(true, "The Geometry successfully updated", existingGeometry);
            }
            catch (Exception ex)
            {
                return new Response<Geometry>(false, $"An error occurred: {ex.Message}", null);
            }
        }

        // Geometriyi siler
        public async Task<Response<Geometry>> DeleteAsync(long id)
        {
            try
            {
                var geometry = await _context.Geometries.FindAsync(id);
                if (geometry == null)
                {
                    return new Response<Geometry>(false, $"The Geometry with Id {id} cannot be found", null);
                }

                _context.Geometries.Remove(geometry);
                await _context.SaveChangesAsync();
                return new Response<Geometry>(true, "The Geometry successfully deleted", geometry);
            }
            catch (Exception ex)
            {
                return new Response<Geometry>(false, $"An error occurred: {ex.Message}", null);
            }
        }

        // ID sıralamasını sıfırlar
        public async Task ResetIdSequence()
        {
            await _context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Geometries\" RESTART IDENTITY;");
        }

    }
}
