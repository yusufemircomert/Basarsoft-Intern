namespace BasarsoftStaj
{
    public interface IUnitOfWork : IDisposable
    {
        IGenericRepository<Geometry> Geometries { get; }
        Task<int> CompleteAsync(); // Değişiklikleri kaydet
    }
}
