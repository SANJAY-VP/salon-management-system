import { PageLayoutDesktop, PageContainerDesktop, Grid } from "../../components/common/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import { Footer } from "../../components/common/Footer";
import { useNavigate } from "react-router-dom";
import { ReviewCard } from "../../components/common/ReusableCards";
import { testimonials } from "../../data/testimonials";
import { faqs } from "../../data/faqs";

export default function Home() {
   const navigate = useNavigate();

   return (
      <PageLayoutDesktop variant="customer" fullScreen={true}>
         {/* Cinematic Hero Section */}
         <section className="relative h-screen flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
               <img
                  src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=2000&q=80"
                  alt="Elite Grooming"
                  className="w-full h-full object-cover scale-110 opacity-80 transition-transform duration-[10000ms] ease-out animate-slow-zoom"
               />
               <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/40 to-background" />
               <div className="absolute inset-x-0 bottom-0 h-[30vh] bg-gradient-to-t from-background to-transparent" />
            </div>
            <div className="relative z-10 max-w-7xl mx-auto px-10 text-center flex flex-col items-center">
               {/* Fix according to UI UX 5s rule */}
               <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-8 leading-tight animate-fade-up">
                  Book Salons Near You <br />
                  <span className="bg-gradient-to-r from-gold via-gold-light to-gold-dark bg-clip-text text-transparent">
                     Faster Booking, Better Choices.
                  </span>
               </h1>

               <p className="max-w-2xl text-lg md:text-xl text-white/70 font-medium mb-12 animate-fade-up delay-150 leading-relaxed">
                  Discover top-rated <span className="text-white font-semibold">salons and barbers near you</span>. Compare services and book instantly.
               </p>

               <div className="flex flex-col md:flex-row gap-6 animate-fade-up delay-300">
                  <Button
                     variant="primary"
                     size="lg"
                     onClick={() => navigate("/customer/search")}
                  >
                     Explore Salons
                  </Button>
                  <Button
                     variant="secondary"
                     size="lg"
                     onClick={() => {
                        const el = document.getElementById('ethos');
                        el?.scrollIntoView({ behavior: 'smooth' });
                     }}
                     className="flex items-center gap-4 group"
                  >
                     Our Mission
                     <Icon icon="back" className="-rotate-90 group-hover:translate-y-2 transition-transform" size={14} />
                  </Button>
               </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-20">
               <div className="w-[1.5px] h-24 bg-gradient-to-b from-transparent via-gold to-transparent" />
            </div>
         </section>

         {/* Purpose & Ethos */}
         <section id="ethos" className="py-64 px-10 relative overflow-hidden group/section">
            <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-gold/[0.02] blur-[150px] rounded-full -ml-300 transform -translate-y-1/2" />

            <PageContainerDesktop maxWidth="2xl">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
                  <div className="relative">
                     <div className="relative z-10 rounded-3xl overflow-hidden border border-white/5 shadow-2xl transition-all duration-1000 group-hover/section:border-gold/20">
                        <img
                           src="https://img.freepik.com/free-photo/man-barbershop-salon-doing-haircut-beard-trim_1303-20953.jpg?w=360"
                           className="w-full aspect-[4/5] object-cover grayscale opacity-60 group-hover/section:grayscale-0 group-hover/section:opacity-100 group-hover/section:scale-105 transition-all duration-1000"
                           alt="Craftsmanship"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                     </div>

                     {/* <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-gold shadow-[0_0_50px_rgba(212,175,55,0.2)] rounded-3xl flex flex-col items-center justify-center p-8 border-[10px] border-background animate-fade-up group-hover/section:rotate-6 transition-all duration-1000">
                     </div> */}
                  </div>

                  <div className="animate-fade-in px-8">
                     <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-12 leading-tight">Better bookings, <br /> Better style</h2>
                     <p className="text-xl text-white/60 font-medium mb-16 leading-relaxed max-w-lg">
                        We partner with the best barbers in your area, ensuring every visit is easy, fast, and gives you the look you want.
                     </p>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
                        <div className="group">
                           <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-6 group-hover:border-gold/30 transition-all">
                              <Icon icon="scissors" size={18} className="text-gold" />
                           </div>
                           <h4 className="text-lg font-bold text-white tracking-tight mb-2">Expert Barbers</h4>
                           <p className="text-sm text-white/50 font-medium">Skilled professionals.</p>
                        </div>
                        <div className="group">
                           <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-6 group-hover:border-gold/30 transition-all">
                              <Icon icon="calendar" size={18} className="text-gold" />
                           </div>
                           <h4 className="text-lg font-bold text-white tracking-tight mb-2">Fast Booking</h4>
                           <p className="text-sm text-white/50 font-medium">No waiting in line.</p>
                        </div>
                     </div>

                     <Button variant="outline" size="lg" onClick={() => navigate("/customer/search")}>
                        Browse Salons
                     </Button>
                  </div>
               </div>
            </PageContainerDesktop>
         </section>

         {/* Testimonials */}
         <section className="py-64 px-10 relative bg-white/[0.01]">
            <PageContainerDesktop maxWidth="2xl">
               <div className="text-center mb-20">
                  <p className="text-4xl font-black text-white tracking-tight uppercase relative z-10">What People Say</p>
               </div>

               <Grid cols={3} gap="lg">
                  {testimonials.map((review, idx) => (
                     <div key={idx} className="animate-fade-up" style={{ animationDelay: `${idx * 150}ms` }}>
                        <ReviewCard review={review} />
                     </div>
                  ))}
               </Grid>
            </PageContainerDesktop>
         </section>

         {/* FAQ Section */}
         <section className="py-64 px-10 relative bg-white/[0.01]">
            <PageContainerDesktop maxWidth="2xl">
               <div className="text-center mb-40">
                  <p className="text-4xl font-black text-white tracking-tight uppercase relative z-10">Frequently Asked Questions</p>
               </div>

               <div className="max-w-4xl mx-auto space-y-6">
                  {faqs.map((faq, idx) => (
                     <Card key={idx} className="p-8 bg-white/[0.02] border-white/5 rounded-[32px] hover:border-gold/20 transition-all duration-700 group cursor-pointer">
                        <details className="group/details">
                           <summary className="list-none flex justify-between items-center cursor-pointer">
                              <span className="text-xl font-bold font-serif text-white uppercase tracking-tighter group-hover/details:text-gold transition-colors">{faq.q}</span>
                              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 group-hover/details:text-gold group-hover/details:border-gold/30 transition-all">
                                 <Icon icon="plus" size={14} className="group-open/details:rotate-45 transition-transform" />
                              </div>
                           </summary>
                           <div className="pt-6 text-sm text-white/60 leading-relaxed max-w-2xl font-medium animate-fade-in">
                              {faq.a}
                           </div>
                        </details>
                     </Card>
                  ))}
               </div>
            </PageContainerDesktop>
         </section>

         <Footer />
      </PageLayoutDesktop>
   );
}
