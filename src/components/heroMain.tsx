import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <div className="relative h-[500px] z-0">
      <div className="absolute inset-0">
        <Image
          src="/images/heroBackground.jpg"
          alt="Interim Job Portal"
          fill
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          priority
          quality={75}
          placeholder="blur"
          blurDataURL="/images/heroBackground_blured.jpg"
        />
      </div>

      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      <div className="relative z-10 flex items-end h-full p-6 sm:p-10">
        <div className="max-w-xl text-left text-white">
          <p className="text-sm font-medium bg-clip-text bg-gradient-to-l from-blue-500 to-blue-700 text-transparent">
            Interim Job Portal
          </p>

          <h1 className="mt-3 text-3xl md:text-4xl font-bold">
            Find Your Next Interim Job
          </h1>

          <p className="mt-4 text-lg text-gray-300">
            Connecting businesses with top interim professionals. Explore flexible job opportunities in various industries. Start your next career journey today.
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              href="#"
              className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Get Started
              <svg
                className="shrink-0 w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
            <Link
              href="#"
              className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-300 text-white hover:bg-gray-100 hover:text-gray-900"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
