import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, FileSpreadsheet, Truck, Search, MapPin, Loader2 } from 'lucide-react';

function App() {
  const [activeMenu, setActiveMenu] = useState('Tracking ETA'); 
  
  // ==========================================
  // STATE
  // ==========================================
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const [search3, setSearch3] = useState('');
  const [dataRFQ, setDataRFQ] = useState([]);
  const [isLoadingRFQ, setIsLoadingRFQ] = useState(false);

  const [dataETA, setDataETA] = useState([]);
  const [isLoadingETA, setIsLoadingETA] = useState(false);
  const [searchETA, setSearchETA] = useState('');

  const [dataDO, setDataDO] = useState([]);
  const [isLoadingDO, setIsLoadingDO] = useState(false);
  const [searchDO, setSearchDO] = useState('');

  // ==========================================
  // FETCH DATA
  // ==========================================
  const fetchRFQData = async () => {
    setIsLoadingRFQ(true);
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbxnEqM_Kivf3O3fNFQYEu_fdl1pGURAxUatCbEA2cXCwQxRqcrTelidx3F7csyiweld_w/exec'); 
      const data = await response.json();
      setDataRFQ(data.filter(row => row['Kode BRP'] || row['Nama Produk']));
    } catch (error) { console.error('Gagal:', error); } finally { setIsLoadingRFQ(false); }
  };

  const fetchETAData = async () => {
    setIsLoadingETA(true);
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbzAPWo45Fddk0aguAN61xHyaJVw-UG0yO_ETNlrTtnF-l4uQZxY-O5cV6sMADEQ5jYUHA/exec'); 
      const data = await response.json();
      setDataETA(data.filter(row => Object.values(row).some(val => val !== '' && val !== null)));
    } catch (error) { console.error('Gagal:', error); } finally { setIsLoadingETA(false); }
  };

  const fetchDOData = async () => {
    setIsLoadingDO(true);
    try {
      const urlDO = 'https://script.google.com/macros/s/AKfycbxmd8Gwn48l6xkxssuw_f8UvjoDtOhscJWO4fpSxwd3kpNSg2nzBvZHmByf7PmKcY68yg/exec?t=' + new Date().getTime();
      const response = await fetch(urlDO); 
      const data = await response.json();
      
      const mappedData = data.map(row => {
        const newRow = {};
        for (let key in row) {
          const cleanKey = key.trim().toUpperCase();
          if (cleanKey === 'NAMA') newRow['NAMA PICKING'] = row[key];
          else if (cleanKey === 'NAMA 1' || cleanKey === 'NAMA_1') newRow['NAMA CHECKING'] = row[key];
          else if (cleanKey === 'START') newRow['START PICKING'] = row[key];
          else if (cleanKey === 'START 1' || cleanKey === 'START_1') newRow['START CHECKING'] = row[key];
          else if (cleanKey === 'END') newRow['END PICKING'] = row[key];
          else if (cleanKey === 'END 1' || cleanKey === 'END_1') newRow['END CHECKING'] = row[key];
          else newRow[key] = row[key];
        }
        return newRow;
      });
      setDataDO(mappedData.filter(row => Object.values(row).some(val => val !== '' && val !== null)));
    } catch (error) { console.error('Gagal:', error); } finally { setIsLoadingDO(false); }
  };

  useEffect(() => {
    if (activeMenu === 'Search RFQ' && dataRFQ.length === 0) fetchRFQData();
    if (activeMenu === 'Tracking ETA' && dataETA.length === 0) fetchETAData();
    if (activeMenu === 'Tracker DO' && dataDO.length === 0) fetchDOData();
  }, [activeMenu]);


  // ==========================================
  // FILTERING SANGAT CEPAT (DENGAN useMemo)
  // ==========================================
  // RFQ hanya diproses jika menu RFQ sedang aktif
  const filteredRFQ = useMemo(() => {
    if (activeMenu !== 'Search RFQ' || dataRFQ.length === 0) return [];
    const keywords = [search1, search2, search3].map(k => k.toLowerCase().trim()).filter(k => k !== '');
    if (keywords.length === 0) return dataRFQ; 
    
    return dataRFQ.filter(item => {
      const gabunganBaris = `${item['Kode BRP'] || ''} ${item['Nama Produk'] || ''} ${item['Produk ID'] || ''}`.toLowerCase();
      return keywords.every(kata => gabunganBaris.includes(kata));
    });
  }, [activeMenu, dataRFQ, search1, search2, search3]);

  // ETA hanya diproses jika menu ETA sedang aktif
  const filteredETA = useMemo(() => {
    if (activeMenu !== 'Tracking ETA' || dataETA.length === 0) return [];
    if (searchETA.trim() === '') return dataETA;
    const searchLower = searchETA.toLowerCase();
    return dataETA.filter(item => Object.values(item).join(' ').toLowerCase().includes(searchLower));
  }, [activeMenu, dataETA, searchETA]);

  // DO hanya diproses jika menu DO sedang aktif
  const filteredDO = useMemo(() => {
    if (activeMenu !== 'Tracker DO' || dataDO.length === 0) return [];
    if (searchDO.trim() === '') return dataDO;
    const searchLower = searchDO.toLowerCase();
    return dataDO.filter(item => Object.values(item).join(' ').toLowerCase().includes(searchLower));
  }, [activeMenu, dataDO, searchDO]);


  const formatRp = (angka) => {
    if (!angka || isNaN(angka)) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
  }

  // ==========================================
  // RENDER UI (DINAMIS)
  // ==========================================
  const renderDynamicTable = (title, dataList, filterList, isLoading, searchQuery, setSearchQuery, fetchFunc, searchPlaceholder) => {
    const headers = dataList.length > 0 ? Object.keys(dataList[0]) : [];

    return (
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#111827' }}>{title}</h2>
          <button onClick={fetchFunc} style={{ padding: '8px 16px', backgroundColor: '#1d4ed8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : '🔄 Refresh Data'}
          </button>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 'bold' }}>Cari Data</label>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={searchPlaceholder} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }} />
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '65vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
              <thead>
                <tr style={{ color: '#4b5563', fontSize: '13px' }}>
                  {headers.map((header, idx) => (
                    <th key={idx} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f9fafb', padding: '12px', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                      {header.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={headers.length || 10} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Memuat data dari Google Sheets...</td></tr>
                ) : filterList.length === 0 ? (
                  <tr><td colSpan={headers.length || 10} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Data tidak ditemukan.</td></tr>
                ) : (
                  // Tetap potong ke 100 baris pertama di UI agar browser tidak berat ngerender elemen
                  filterList.slice(0, 100).map((row, rowIdx) => (
                    <tr key={rowIdx} style={{ borderBottom: '1px solid #e5e7eb', fontSize: '13px', color: '#111827' }}>
                      {headers.map((header, colIdx) => {
                        let cellValue = row[header];
                        if (typeof cellValue === 'string' && cellValue.match(/^\d{4}-\d{2}-\d{2}T/)) {
                          cellValue = new Date(cellValue).toLocaleDateString('id-ID');
                        }
                        
                        const isBulanColumn = header === 'BULAN';
                        const isStatusColumn = header.toLowerCase().includes('status');
                        
                        return (
                          <td key={colIdx} style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                            {isBulanColumn ? (
                               <span style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{cellValue}</span>
                            ) : isStatusColumn ? (
                              <span style={{ backgroundColor: cellValue === 'Complete' ? '#dcfce3' : '#dbeafe', color: cellValue === 'Complete' ? '#166534' : '#1e40af', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{cellValue || '-'}</span>
                            ) : (
                              cellValue !== '' && cellValue !== null && cellValue !== undefined ? cellValue : '-'
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (activeMenu === 'Tracker DO') return renderDynamicTable('🚚 SIBIMA Tracker DO (Semua Bulan)', dataDO, filteredDO, isLoadingDO, searchDO, setSearchDO, fetchDOData, "Ketik nama driver, no polisi, atau NAMA...");
    if (activeMenu === 'Tracking ETA') return renderDynamicTable('📍 Tracking ETA Purchasing', dataETA, filteredETA, isLoadingETA, searchETA, setSearchETA, fetchETAData, "Ketik PO, Supplier, atau status...");
    
    // --- TAMPILAN SEARCH RFQ ---
    if (activeMenu === 'Search RFQ') {
      return (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#111827' }}>🔍 Search Engine RFQ</h2>
            <button onClick={fetchRFQData} style={{ padding: '8px 16px', backgroundColor: '#1d4ed8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isLoadingRFQ ? <Loader2 size={16} className="animate-spin" /> : '🔄 Refresh Data Produk'}
            </button>
          </div>
          
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 'bold' }}>Kata Kunci 1</label><input type="text" value={search1} onChange={(e) => setSearch1(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }} /></div>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 'bold' }}>Kata Kunci 2</label><input type="text" value={search2} onChange={(e) => setSearch2(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }} /></div>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 'bold' }}>Kata Kunci 3</label><input type="text" value={search3} onChange={(e) => setSearch3(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }} /></div>
            <button onClick={() => { setSearch1(''); setSearch2(''); setSearch3(''); }} style={{ padding: '10px 20px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Reset</button>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#374151' }}>Hasil: <span style={{ color: '#1d4ed8' }}>{isLoadingRFQ ? '...' : filteredRFQ.length} Barang</span></h3>
            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '60vh' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
                <thead><tr style={{ color: '#4b5563', fontSize: '13px' }}><th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f9fafb', padding: '12px', borderBottom: '2px solid #e5e7eb' }}>KODE BRP</th><th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f9fafb', padding: '12px', borderBottom: '2px solid #e5e7eb' }}>NAMA PRODUK</th><th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f9fafb', padding: '12px', borderBottom: '2px solid #e5e7eb' }}>PRODUK ID</th><th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f9fafb', padding: '12px', borderBottom: '2px solid #e5e7eb' }}>HARGA JUAL</th><th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f9fafb', padding: '12px', borderBottom: '2px solid #e5e7eb' }}>HARGA BELI</th><th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f9fafb', padding: '12px', borderBottom: '2px solid #e5e7eb' }}>STATUS</th><th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f9fafb', padding: '12px', borderBottom: '2px solid #e5e7eb' }}>GUDANG</th></tr></thead>
                <tbody>
                  {isLoadingRFQ ? <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Memuat database RFQ...</td></tr> : filteredRFQ.slice(0, 100).map((row, idx) => ( 
                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', fontSize: '13px', color: '#111827' }}><td style={{ padding: '12px', fontWeight: 'bold' }}>{row['Kode BRP'] || '-'}</td><td style={{ padding: '12px', fontWeight: 'bold', color: '#1e40af' }}>{row['Nama Produk'] || '-'}</td><td style={{ padding: '12px' }}>{row['Produk ID'] || '-'}</td><td style={{ padding: '12px', fontWeight: 'bold', color: '#166534' }}>{formatRp(row['Harga Jual'])}</td><td style={{ padding: '12px' }}>{formatRp(row['Harga Beli'])}</td><td style={{ padding: '12px' }}><span style={{ backgroundColor: row['Status Harga'] === 'Perlu Diperbarui' ? '#fef3c7' : '#dcfce3', color: row['Status Harga'] === 'Perlu Diperbarui' ? '#b45309' : '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{row['Status Harga'] || '-'}</span></td><td style={{ padding: '12px' }}>{row['Gudang'] || '-'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#6b7280' }}>
        <h2>Modul {activeMenu}</h2>
        <p>Halaman ini sedang dalam tahap pengembangan...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      <div style={{ width: '250px', backgroundColor: '#ffffff', borderRight: '1px solid #e5e7eb', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '30px' }}>📦 SIBIMA System</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {[
            { name: 'Dashboard', icon: <LayoutDashboard size={18} /> }, 
            { name: 'Data OTS', icon: <FileSpreadsheet size={18} /> }, 
            { name: 'Tracker DO', icon: <Truck size={18} /> }, 
            { name: 'Tracking ETA', icon: <MapPin size={18} /> },
            { name: 'Search RFQ', icon: <Search size={18} /> }
          ].map((item) => (
            <li key={item.name} onClick={() => setActiveMenu(item.name)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', marginBottom: '10px', borderRadius: '8px', cursor: 'pointer', backgroundColor: activeMenu === item.name ? '#eff6ff' : 'transparent', color: activeMenu === item.name ? '#1d4ed8' : '#4b5563', fontWeight: activeMenu === item.name ? 'bold' : 'normal', transition: 'all 0.1s' }}>
              {item.icon} {item.name}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flex: 1, padding: '30px', height: '100vh', overflowY: 'auto' }}>{renderContent()}</div>
    </div>
  );
}

export default App;