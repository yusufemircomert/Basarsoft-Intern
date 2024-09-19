using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace BasarsoftStaj
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly dbContext _context;
        private IGenericRepository<Geometry> _geometries;

        public UnitOfWork(dbContext context)
        {
            _context = context;
        }

        public IGenericRepository<Geometry> Geometries
        {
            get
            {
                if (_geometries == null)
                {
                    _geometries = new GenericRepository<Geometry>(_context);
                }
                return _geometries;
            }
        }

        public async Task<int> CompleteAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
