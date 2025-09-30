import React, { useState, useEffect } from "react";
import axios from "axios";
import {jwtDecode} from 'jwt-decode';
import "./Statistics.css";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const Statistics = () => {
  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [readBooks, setReadBooks] = useState([]);
  const [dnfBooks, setDNFBooks] = useState([]);
  const [totalPagesRead, setTotalPagesRead] = useState(0);
  const [pages300, setPages300] = useState(0);
  const [pages300499, setPages300499] = useState(0);
  const [pages500, setPages500] = useState(0);
  const [genresData, setGenresData] = useState([]);

  const getCurrentUserId = () => {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      try {
        const decoded = jwtDecode(token);
        return decoded.userId;
      } catch (error) {
        console.error('Eroare decodare token:', error);
        return null;
      }
    };
  const userId = getCurrentUserId(); 
  console.log("user id ", userId);

  const [stats, setStats] = useState({
    mostReadAuthors: [],
    booksByMonth: [], 
  });

  useEffect(() => {
    const monthlyStats = {};
    const fetchBooks = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/readingstatuses/user/${userId}`);
        console.log('API response:', response.data);
       
        const books = Array.isArray(response.data) ? response.data : [response.data];
        setReadBooks(books.filter((b) => b.status === "read"));
        setDNFBooks(books.filter((b) => b.status === "dnf")); 
        setCurrentlyReading(books.filter((b) => b.status === "currently_reading")); 

        books.forEach(book => {
          if (book.updatedAt && (book.status === "read" || book.status === "dnf")) {
              const date = new Date(book.updatedAt);
              console.log("date = ", date);
              const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
              console.log("monthYear = ", monthYear);
              
              if (!monthlyStats[monthYear]) {
                  monthlyStats[monthYear] = { readBooks: 0, dnfBooks: 0 };
              }
              
              if (book.status === "read") {
                monthlyStats[monthYear].readBooks++;
              } else if (book.status === "dnf") {
                monthlyStats[monthYear].dnfBooks++;
              }
          }
      });
        
     
      const booksByMonth = Object.entries(monthlyStats)
        .map(([month, stats]) => ({
          month: new Date(month + " 1"), 
          readBooks: stats.readBooks,
          dnfBooks: stats.dnfBooks
        }))
        .sort((a, b) => a.month - b.month)
        .map(({ month, readBooks, dnfBooks }) => ({
          month: month.toLocaleString('default', { month: 'short', year: 'numeric' }),
          readBooks,
          dnfBooks
        }));

      console.log("Processed booksByMonth:", booksByMonth); 
      
      setStats(prev => ({
        ...prev,
        booksByMonth,
      }));

      } catch (error) {
        console.error("Error fetching books:", error);
      }
    };

    fetchBooks();
  }, [userId]);

  useEffect(() => {
    const fetchBookStats = async () => {
      const genreCounter = {};
      const authorCounter = new Map();
      let totalPages = 0;
      const pageRanges = [0, 0, 0];

      await Promise.all(
        [...readBooks, ...currentlyReading].map(async (book) => {
          try {
            if(book.status === "read"){
              const res = await axios.get(`https://www.googleapis.com/books/v1/volumes/${book.google_books_id}`);
              const info = res.data.volumeInfo;
  
              const primaryGenre = info.categories?.[0]?.split('/')[0]?.trim() || 'Unknown';
              genreCounter[primaryGenre] = (genreCounter[primaryGenre] || 0) + 1;
  
              const primaryAuthor = info.authors?.[0]?.trim() || 'Unknown';
              authorCounter.set(primaryAuthor, (authorCounter.get(primaryAuthor) || 0) + 1);
  
              if (info.pageCount) {
                if (info.pageCount < 300) pageRanges[0]++;
                else if (info.pageCount < 500) pageRanges[1]++;
                else pageRanges[2]++;
              }
              if (book.pages) {
                totalPages += book.pages;
              }
            } else if (book.status === "currently_reading"){
              if (book.page_counter) {
                totalPages += book.page_counter;
              }
            }
           
          } catch (err) {
            console.error(`Error processing ${book.google_books_id}:`, err);
          }
        })
      );

      const genresData = Object.entries(genreCounter)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const mostReadAuthors = Array.from(authorCounter.entries())
        .map(([author, count]) => ({ author, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

        console.log("total pages: ", totalPages);
      

      setGenresData(genresData);
      setTotalPagesRead(totalPages);
      setPages300(pageRanges[0]);
      setPages300499(pageRanges[1]);
      setPages500(pageRanges[2]);
      setStats(prev => ({
        ...prev,
        mostReadAuthors,
      }));
    };

    if (readBooks.length || currentlyReading.length) fetchBookStats();
  }, [readBooks]);
  
  const pageDistributionData = [
    { range: "<300", count: pages300 },
    { range: "300-499", count: pages300499 },
    { range: "500+", count: pages500 },
  ];

  return (
    <div className="statistics-container">
      
      <div className="stats-summary">
        <p><strong>Total Books Read:</strong> {readBooks.length}</p>
        <p><strong>Total Pages Read:</strong> {totalPagesRead}</p>
      </div>

      <div className="chart-container">
        <h3>Page Number Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pageDistributionData}>
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" name="Number of Books" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h3>Primary Genres</h3>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={genresData}
            layout="vertical"
            margin={{ left: 100 }}
          >
            <XAxis type="number" label="Books Read" />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(count) => [
                `${count} ${count === 1 ? 'book' : 'books'}`,
                'Count'
              ]}
            />
            <Bar 
              dataKey="count" 
              name="Books" 
              animationDuration={1000}
            >
              {genresData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={`hsl(${index * 45 % 360}, 70%, 60%)`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {stats.mostReadAuthors && stats.mostReadAuthors.length > 0 && (
        <div className="chart-container">
          <h3>Top 10 Most Read Authors</h3>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={stats.mostReadAuthors}
              layout="vertical"
              margin={{ left: 150, right: 20 }}
            >
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="author" 
                width={180}
                tick={{ fontSize: 14 }}
              />
              <Tooltip 
                formatter={(count) => [`${count} books`, 'Count']}
              />
              <Bar 
                dataKey="count" 
                name="Books"
                barSize={30}
              >
                {stats.mostReadAuthors.map((_, index) => (
                  <Cell 
                    key={`author-cell-${index}`}
                    fill={`hsl(${index * 36}, 70%, 50%)`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

{stats.booksByMonth && stats.booksByMonth.length > 0 && (
  <div className="chart-container">
    <h3>Reading Timeline</h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={stats.booksByMonth}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="readBooks" fill="#6873e3" name="Completed Books" />
        <Bar dataKey="dnfBooks" fill="#ff7675" name="DNF Books" />
      </BarChart>
    </ResponsiveContainer>
  </div>
)}

      <div className="chart-container">
        <h3>Completed vs. Abandoned Books</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                { status: "Completed", count: readBooks.length },
                { status: "Abandoned", count: dnfBooks.length }
              ]}
              
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              <Cell fill="#6873e3" />
              <Cell fill="#ff7675" />
            </Pie>
            <Tooltip 
        formatter={(count, name, props) => [
          `${count} ${count === 1 ? 'book' : 'books'}`,
          props.payload.status
        ]}
      />
          </PieChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default Statistics;