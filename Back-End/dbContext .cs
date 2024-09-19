using Microsoft.EntityFrameworkCore;

namespace BasarsoftStaj
{
    public class dbContext : DbContext
    {
        public dbContext(DbContextOptions<dbContext> options)
            : base(options)
        {
        }

        public DbSet<Geometry> Geometries { get; set; }
    }
}
